import type { Env, SlotRow, SlotStatus } from './types.ts';

const API = 'https://www.googleapis.com/youtube/v3';
const MINUTE = 60_000;
const DEFAULT_DURATION_MINUTES = 180;
const MAX_DURATION_MINUTES = 1_440;
/** A waiting room that is still "upcoming" this long after its start time was never used. */
const MISSED_AFTER_MS = 6 * 60 * MINUTE;
/** An ended stream the table has never seen is only worth storing while it is still inside the schedule window. */
const HISTORY_MS = 2 * 86_400_000;
/** Followers are only pinged for a stream that started recently, so an outage never turns into a late alert. */
const FRESH_LIVE_MS = 30 * MINUTE;

export interface YtVideo {
  id: string;
  snippet: {
    title: string;
    publishedAt: string;
    liveBroadcastContent: 'live' | 'upcoming' | 'none';
    thumbnails?: Record<string, { url: string } | undefined>;
  };
  liveStreamingDetails?: { scheduledStartTime?: string; actualStartTime?: string; actualEndTime?: string };
}

/** What the Worker writes. Hand-edited columns (description, members_only) are left out so an upsert never overwrites them. */
export interface SlotUpsert {
  id: string;
  title: string;
  datetime: string;
  duration_minutes: number;
  platform: 'youtube';
  thumbnail_url: string | null;
  live_status: SlotStatus;
}

export interface LiveEvent {
  id: string;
  title: string;
}

export interface Plan {
  upserts: SlotUpsert[];
  removals: string[];
  wentLive: LiveEvent[];
}

export const isVideoId = (value: string): boolean => /^[\w-]{11}$/.test(value);

const toMs = (iso: string | undefined): number | null => {
  const parsed = iso ? Date.parse(iso) : Number.NaN;
  return Number.isNaN(parsed) ? null : parsed;
};

function toStatus(video: YtVideo): SlotStatus | null {
  const details = video.liveStreamingDetails;
  if (!details) return null;
  switch (video.snippet.liveBroadcastContent) {
    case 'live':
      return 'live';
    case 'upcoming':
      return 'upcoming';
    default:
      return details.actualEndTime ? 'ended' : null;
  }
}

/** Only YouTube's own image host is stored: the site's CSP allows nothing else, and the column is shown to every visitor. */
function pickThumbnail(video: YtVideo): string | null {
  const sizes = video.snippet.thumbnails ?? {};
  const url = (sizes.maxres ?? sizes.standard ?? sizes.high ?? sizes.medium)?.url;
  return url?.startsWith('https://i.ytimg.com/') ? url : null;
}

const cleanTitle = (title: string): string => Array.from(title.trim()).slice(0, 200).join('');
const clampDuration = (minutes: number): number => Math.min(MAX_DURATION_MINUTES, Math.max(1, Math.round(minutes)));

function isSame(previous: SlotRow, next: SlotUpsert): boolean {
  return (
    previous.title === next.title &&
    Date.parse(previous.datetime) === Date.parse(next.datetime) &&
    previous.thumbnailUrl === next.thumbnail_url &&
    previous.liveStatus === next.live_status &&
    previous.durationMinutes === next.duration_minutes
  );
}

function endedNow(previous: SlotRow, now: number): SlotUpsert {
  const start = Date.parse(previous.datetime);
  return {
    id: previous.id,
    title: previous.title,
    datetime: new Date(start).toISOString(),
    duration_minutes: clampDuration((now - start) / MINUTE),
    platform: 'youtube',
    thumbnail_url: previous.thumbnailUrl,
    live_status: 'ended',
  };
}

/**
 * Turns what YouTube says into table changes. Pure on purpose: everything it needs comes in as arguments.
 * Rules: rows added by hand and rows already ended are never touched; in guerilla mode nothing about the schedule is written, only streams that are live or ended.
 */
export function planChanges(input: { ids: string[]; videos: YtVideo[]; known: SlotRow[]; guerilla: boolean; now: number }): Plan {
  const { ids, guerilla, now } = input;
  const videos = new Map(input.videos.map((video) => [video.id, video]));
  const known = new Map(input.known.map((row) => [row.id, row]));
  const plan: Plan = { upserts: [], removals: [], wentLive: [] };

  for (const id of ids) {
    const previous = known.get(id);
    if (previous && (previous.liveStatus === null || previous.liveStatus === 'ended')) continue;

    const video = videos.get(id);
    const status = video ? toStatus(video) : null;
    const details = video?.liveStreamingDetails;

    // Deleted, made private or turned into a plain video: a waiting room disappears, a stream that was on is closed.
    if (!video || !status || !details) {
      if (previous?.liveStatus === 'live') plan.upserts.push(endedNow(previous, now));
      else if (previous) plan.removals.push(id);
      continue;
    }

    const actualStart = toMs(details.actualStartTime);
    const start = actualStart ?? toMs(details.scheduledStartTime) ?? toMs(video.snippet.publishedAt);
    if (start === null) continue;

    let duration = previous?.durationMinutes ?? DEFAULT_DURATION_MINUTES;

    if (status === 'upcoming') {
      if (guerilla) continue;
      if (start < now - MISSED_AFTER_MS) {
        if (previous) plan.removals.push(id);
        continue;
      }
    }

    if (status === 'ended') {
      const end = toMs(details.actualEndTime);
      if (actualStart === null || end === null) continue;
      if (!previous && end < now - HISTORY_MS) continue;
      duration = clampDuration((end - actualStart) / MINUTE);
    }

    const row: SlotUpsert = {
      id,
      title: cleanTitle(video.snippet.title),
      datetime: new Date(start).toISOString(),
      duration_minutes: duration,
      platform: 'youtube',
      thumbnail_url: pickThumbnail(video),
      live_status: status,
    };
    if (previous && isSame(previous, row)) continue;

    plan.upserts.push(row);
    if (status === 'live' && previous?.liveStatus !== 'live' && now - start < FRESH_LIVE_MS) plan.wentLive.push({ id, title: row.title });
  }

  return plan;
}

async function youtubeGet<T>(env: Env, path: string, params: Record<string, string>): Promise<T | null> {
  const response = await fetch(`${API}/${path}?${new URLSearchParams(params)}`, {
    headers: { 'x-goog-api-key': env.YOUTUBE_API_KEY },
    signal: AbortSignal.timeout(10_000),
  });
  // A channel with no streams has no such playlist.
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`YouTube ${path} failed: ${response.status}`);
  return (await response.json()) as T;
}

export async function resolveChannelId(env: Env): Promise<string> {
  const result = await youtubeGet<{ items?: { id: string }[] }>(env, 'channels', { part: 'id', forHandle: env.YOUTUBE_HANDLE });
  const id = result?.items?.[0]?.id;
  if (!id || !/^UC[\w-]{22}$/.test(id)) throw new Error(`YouTube channel ${env.YOUTUBE_HANDLE} not found`);
  return id;
}

// A channel id `UCxxx` has one auto-made playlist per kind of upload: `UULVxxx` live streams, `UULFxxx` regular videos, `UUSHxxx` Shorts.
const UPLOAD_PLAYLISTS = { live: 'UULV', vod: 'UULF', short: 'UUSH' } as const;
export type VideoKind = keyof typeof UPLOAD_PLAYLISTS;
/** Later wins when a video sits in two playlists: what is in the /videos tab is a video, and a Short is a Short. */
export const VIDEO_KINDS: readonly VideoKind[] = ['live', 'vod', 'short'];

export interface VideoUpsert {
  id: string;
  kind: VideoKind;
  title: string;
  published_at: string;
}

interface PlaylistPage {
  items: { snippet: { title: string }; contentDetails: { videoId: string; videoPublishedAt?: string } }[];
}

async function playlistPage(env: Env, channelId: string, kind: VideoKind, max: number): Promise<PlaylistPage['items']> {
  const result = await youtubeGet<PlaylistPage>(env, 'playlistItems', {
    part: 'snippet,contentDetails',
    playlistId: UPLOAD_PLAYLISTS[kind] + channelId.slice(2),
    maxResults: String(max),
  });
  return result?.items ?? [];
}

/** The channel's "live streams" playlist, newest first. One quota unit. */
export async function playlistVideoIds(env: Env, channelId: string, max: number): Promise<string[]> {
  return (await playlistPage(env, channelId, 'live', max)).map((item) => item.contentDetails.videoId);
}

/** Up to 50 uploads of one kind for one quota unit. Private and deleted videos stay in a playlist but have no publish date, so they are dropped. */
export async function uploadsOfKind(env: Env, channelId: string, kind: VideoKind, max = 50): Promise<VideoUpsert[]> {
  return (await playlistPage(env, channelId, kind, max)).flatMap(({ snippet, contentDetails }) =>
    contentDetails.videoPublishedAt ? [{ id: contentDetails.videoId, kind, title: cleanTitle(snippet.title), published_at: contentDetails.videoPublishedAt }] : [],
  );
}

const feedUrl = (channelId: string): string => `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`;

export function parseVideoIds(xml: string): string[] {
  return [...new Set([...xml.matchAll(/<yt:videoId>([\w-]{11})<\/yt:videoId>/g)].map((match) => match[1] as string))];
}

/** The channel's public Atom feed: free (no quota) and lists new uploads and waiting rooms. A failure is not fatal, the playlist covers for it. */
export async function feedVideoIds(channelId: string): Promise<string[]> {
  try {
    const response = await fetch(feedUrl(channelId), { signal: AbortSignal.timeout(8_000) });
    return response.ok ? parseVideoIds(await response.text()) : [];
  } catch {
    return [];
  }
}

/** Status and times of up to 50 videos in one quota unit. */
export async function getVideos(env: Env, ids: string[]): Promise<YtVideo[]> {
  if (ids.length === 0) return [];
  const result = await youtubeGet<{ items?: YtVideo[] }>(env, 'videos', {
    part: 'snippet,liveStreamingDetails',
    id: ids.join(','),
    maxResults: '50',
  });
  return result?.items ?? [];
}
