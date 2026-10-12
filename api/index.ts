import { timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { Hono } from 'hono';

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be set');

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

type Localized = Record<'en' | 'jp' | 'id' | 'kr', string>;

interface StreamSlotRow {
  id: string;
  title: string;
  description: Localized;
  datetime: string;
  durationMinutes: number;
  platform: 'youtube' | 'twitch' | 'x' | 'discord';
  membersOnly: boolean;
  thumbnailUrl: string | null;
}

interface PreferenceRow {
  id: number;
  kind: 'like' | 'dislike';
  label: Localized;
}

interface NoteRow {
  id: number;
  name: string;
  text: string;
}

interface FanartRow {
  id: number;
  username: string;
  mediaUrl: string;
  postedAt: string;
}

interface VideoRow {
  id: string;
  title: string;
  publishedAt: string;
}

interface YouTubePlaylistPage {
  nextPageToken?: string;
  items: { snippet: { title: string }; contentDetails: { videoId: string; videoPublishedAt?: string } }[];
}

const DAY_MS = 86_400_000;
const cacheControl = (sMaxAge: number, staleWhileRevalidate: number): string => `public, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
const SCHEDULE_CACHE = cacheControl(60, 300);
const SLOW_CACHE = cacheControl(3_600, 86_400);

const FANART_PAGE_SIZE = 12;
const FANART_MAX_PAGE = 100;

const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_HANDLE = '@MizuHamzazu';
// A channel id `UCxxx` has one auto-made playlist per kind of upload: `UULVxxx` live streams, `UUSHxxx` Shorts, `UULFxxx` regular videos.
const VIDEO_PLAYLIST_PREFIX = { live: 'UULV', short: 'UUSH', vod: 'UULF' } as const;
type VideoKind = keyof typeof VIDEO_PLAYLIST_PREFIX;
const VIDEO_PAGE_SIZE = 30;
const VIDEO_SYNC_MAX_PAGES = 20;

const app = new Hono({ strict: false });

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error || data === null) throw new Error(`Supabase: ${error?.message ?? 'no data'}`, { cause: error });
  return data;
}

const isVideoKind = (value: string): value is VideoKind => value in VIDEO_PLAYLIST_PREFIX;

async function youtube<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const { YOUTUBE_API_KEY } = process.env;
  if (!YOUTUBE_API_KEY) throw new Error('YOUTUBE_API_KEY must be set');

  const response = await fetch(`${YOUTUBE_API}/${path}?${new URLSearchParams(params)}`, { headers: { 'x-goog-api-key': YOUTUBE_API_KEY } });
  // A channel with no Shorts (or no streams) has no such playlist.
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`YouTube ${path} failed: ${response.status}`);
  return (await response.json()) as T;
}

async function fetchChannelVideos(channelId: string, kind: VideoKind) {
  const playlistId = VIDEO_PLAYLIST_PREFIX[kind] + channelId.slice(2);
  const rows: { id: string; kind: VideoKind; title: string; published_at: string }[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < VIDEO_SYNC_MAX_PAGES; page++) {
    const result = await youtube<YouTubePlaylistPage>('playlistItems', { part: 'snippet,contentDetails', playlistId, maxResults: '50', ...(pageToken && { pageToken }) });
    if (!result) break;
    // Private and deleted videos stay in a playlist but have no publish date.
    for (const { snippet, contentDetails } of result.items) {
      if (contentDetails.videoPublishedAt) rows.push({ id: contentDetails.videoId, kind, title: snippet.title, published_at: contentDetails.videoPublishedAt });
    }
    if (!result.nextPageToken) break;
    pageToken = result.nextPageToken;
  }
  return rows;
}

/** Called by the daily cron: copies the whole channel from YouTube into Supabase. */
async function syncVideos(): Promise<void> {
  const channel = await youtube<{ items?: { id: string }[] }>('channels', { part: 'id', forHandle: YOUTUBE_HANDLE });
  const channelId = channel?.items?.[0]?.id;
  if (!channelId) throw new Error(`YouTube channel ${YOUTUBE_HANDLE} not found`);

  const rows = (await Promise.all((Object.keys(VIDEO_PLAYLIST_PREFIX) as VideoKind[]).map((kind) => fetchChannelVideos(channelId, kind)))).flat();
  const { error } = await supabase.from('videos').upsert(rows);
  if (error) throw new Error(`Supabase: ${error.message}`, { cause: error });
}

const readVideos = async (kind: VideoKind): Promise<VideoRow[]> =>
  unwrap(
    await supabase
      .from('videos')
      .select('id,title,publishedAt:published_at')
      .eq('kind', kind)
      .order('published_at', { ascending: false })
      .limit(VIDEO_PAGE_SIZE)
      .overrideTypes<VideoRow[], { merge: false }>(),
  );

// Every distinct URL is its own CDN cache key, so a query string would bypass the cache and reach the database.
app.use('/api/*', async (c, next) => {
  if (!c.req.url.includes('?')) return next();
  c.header('Cache-Control', 'no-store');
  return c.json({ error: 'Query parameters are not accepted' }, 400);
});

app.get('/api/schedule', async (c) => {
  const now = Date.now();
  const slots = unwrap(
    await supabase
      .from('stream_slots')
      .select('id,title,description,datetime,durationMinutes:duration_minutes,platform,membersOnly:members_only,thumbnailUrl:thumbnail_url')
      .gte('datetime', new Date(now - DAY_MS).toISOString())
      .lt('datetime', new Date(now + 8 * DAY_MS).toISOString())
      .order('datetime')
      .limit(100)
      .overrideTypes<StreamSlotRow[], { merge: false }>(),
  );

  c.header('Cache-Control', SCHEDULE_CACHE);
  return c.json(slots);
});

app.get('/api/preferences', async (c) => {
  const preferences = unwrap(
    await supabase.from('likes_dislikes').select('id,kind,label').order('sort_order').order('id').overrideTypes<PreferenceRow[], { merge: false }>(),
  );

  c.header('Cache-Control', SLOW_CACHE);
  return c.json(preferences);
});

app.get('/api/notes', async (c) => {
  const notes = unwrap(
    await supabase
      .from('viewers_notes')
      .select('id,name,text:note')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(60)
      .overrideTypes<NoteRow[], { merge: false }>(),
  );

  c.header('Cache-Control', SLOW_CACHE);
  return c.json(notes);
});

app.get('/api/fanart/:page', async (c) => {
  // Digits only: `Number()` would also accept `0x10`, `1e1` or `+5`, each a separate cache key for the same page.
  const raw = c.req.param('page');
  const page = Number(raw);
  if (!/^[1-9]\d{0,2}$/.test(raw) || page > FANART_MAX_PAGE) {
    c.header('Cache-Control', 'no-store');
    return c.json({ error: 'Not Found' }, 404);
  }

  // One row more than the page, only to know whether a next page exists.
  const from = (page - 1) * FANART_PAGE_SIZE;
  const rows = unwrap(
    await supabase
      .from('fanarts')
      .select('id,username,mediaUrl:media_url,postedAt:posted_at')
      .order('posted_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, from + FANART_PAGE_SIZE)
      .overrideTypes<FanartRow[], { merge: false }>(),
  );

  c.header('Cache-Control', SCHEDULE_CACHE);
  return c.json({ posts: rows.slice(0, FANART_PAGE_SIZE), hasMore: rows.length > FANART_PAGE_SIZE && page < FANART_MAX_PAGE });
});

app.get('/api/content/:kind', async (c) => {
  const kind = c.req.param('kind');
  if (!isVideoKind(kind)) {
    c.header('Cache-Control', 'no-store');
    return c.json({ error: 'Not Found' }, 404);
  }

  c.header('Cache-Control', SLOW_CACHE);
  return c.json(await readVideos(kind));
});

// Vercel Cron calls this daily with `Authorization: Bearer $CRON_SECRET`.
app.get('/api/videos/sync', async (c) => {
  c.header('Cache-Control', 'no-store');
  const { CRON_SECRET } = process.env;
  const given = Buffer.from(c.req.header('authorization') ?? '');
  const expected = Buffer.from(`Bearer ${CRON_SECRET}`);
  if (!CRON_SECRET || given.length !== expected.length || !timingSafeEqual(given, expected)) return c.json({ error: 'Unauthorized' }, 401);

  await syncVideos();
  return c.json({ ok: true });
});

app.onError((error, c) => {
  console.error(error);
  c.header('Cache-Control', 'no-store');
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default { fetch: app.fetch };
