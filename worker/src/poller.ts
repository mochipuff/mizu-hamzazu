import { params, rest } from './supabase.ts';
import { livePayload, sendPush } from './push.ts';
import type { GuerillaEvent, Env, LiveStatusEvent, PushJob, SlotRow, Subscription } from './types.ts';
import { feedVideoIds, getVideos, isVideoId, planChanges, playlistVideoIds, resolveChannelId, uploadsOfKind, VIDEO_KINDS, type VideoUpsert } from './youtube.ts';

type Hub = DurableObjectStub<import('./hub.ts').LiveHub>;

const MINUTE = 60_000;
const DAY = 86_400_000;
/** Polling pace: 5 minutes normally, every minute within 30 minutes of a slot's start or while guerilla mode is on. */
const IDLE_POLL_MS = 5 * MINUTE;
const BURST_POLL_MS = MINUTE;
const BURST_WINDOW_MS = 30 * MINUTE;
/** The cron fires on the minute with a little jitter; without this slack a 60 s interval would skip every other tick. */
const TICK_SLACK_MS = 5_000;
/** Google allows 10,000 units a day. A poll costs 2 (playlist + videos), a sync 3; the rest is kept as headroom. */
const QUOTA_BUDGET = 9_000;
const POLL_UNITS = 2;
const SYNC_UNITS = 3;
const BACKFILL_COOLDOWN_MS = 30 * MINUTE;
const PUSH_JOB_TTL_MS = 30 * MINUTE;
const PUSH_BATCH = 40;

const SLOT_SELECT = 'id,title,description,datetime,durationMinutes:duration_minutes,platform,membersOnly:members_only,thumbnailUrl:thumbnail_url,liveStatus:live_status';
const OFFLINE: LiveStatusEvent = { is_live: false, platform: 'youtube', stream_title: '', url: '', started_at: '' };

/** How long to wait between two YouTube polls right now. Pure, so the schedule logic is testable. */
export function pollInterval(input: { guerilla: boolean; slots: Pick<SlotRow, 'datetime' | 'liveStatus'>[]; now: number }): number {
  const { guerilla, slots, now } = input;
  const nearSlot = slots.some(({ datetime, liveStatus }) => liveStatus === 'live' || Math.abs(Date.parse(datetime) - now) <= BURST_WINDOW_MS);
  return guerilla || nearSlot ? BURST_POLL_MS : IDLE_POLL_MS;
}

/** What the site shows as "live now", derived from the slot rows so a hand edit in the Table Editor counts too. */
export function liveStatusOf(slots: SlotRow[]): LiveStatusEvent {
  const live = slots
    .filter((slot) => slot.liveStatus === 'live' && (slot.platform === 'youtube' || slot.platform === 'twitch'))
    .sort((a, b) => Date.parse(b.datetime) - Date.parse(a.datetime))[0];
  if (!live) return OFFLINE;
  return {
    is_live: true,
    platform: live.platform === 'twitch' ? 'twitch' : 'youtube',
    stream_title: live.title,
    url: live.platform === 'youtube' && isVideoId(live.id) ? `https://www.youtube.com/watch?v=${live.id}` : '',
    started_at: live.datetime,
  };
}

const loadJob = async (hub: Hub): Promise<PushJob | null> => (await hub.load('push-job')) as PushJob | null;

async function readGuerilla(env: Env): Promise<GuerillaEvent> {
  const rows = await rest<{ value: { active?: unknown; message?: unknown } }[]>(env, 'system_configs', {
    query: params({ select: 'value', key: 'eq.guerilla_mode', limit: '1' }),
  });
  const value = rows[0]?.value;
  return { is_active: value?.active === true, notice: typeof value?.message === 'string' ? value.message : '' };
}

export async function readSlots(env: Env, now: number): Promise<SlotRow[]> {
  return rest<SlotRow[]>(env, 'stream_slots', {
    query: params({
      select: SLOT_SELECT,
      datetime: [`gte.${new Date(now - DAY).toISOString()}`, `lt.${new Date(now + 8 * DAY).toISOString()}`],
      order: 'datetime.asc',
      limit: '100',
    }),
  });
}

/** Sends the current state to every connected page. The hub drops a message that did not change, so calling this every tick costs nothing. */
export async function publishState(hub: Hub, guerilla: GuerillaEvent, slots: SlotRow[]): Promise<void> {
  await Promise.all([hub.publish('system:guerilla', guerilla), hub.publish('schedule:update', { slots }), hub.publish('live:status', liveStatusOf(slots))]);
}

async function pollYouTube(env: Env, hub: Hub, slots: SlotRow[], guerilla: boolean, now: number): Promise<boolean> {
  if (!(await hub.spendQuota(POLL_UNITS, QUOTA_BUDGET))) return false;

  const channelId = await channelIdOf(env, hub);
  const open = slots.filter((slot) => slot.platform === 'youtube' && (slot.liveStatus === 'upcoming' || slot.liveStatus === 'live')).map((slot) => slot.id);
  const [recent, feed] = await Promise.all([playlistVideoIds(env, channelId, 10), feedVideoIds(channelId)]);
  const ids = [...new Set([...open, ...feed, ...recent])].filter(isVideoId).slice(0, 50);

  const plan = planChanges({ ids, videos: await getVideos(env, ids), known: slots, guerilla, now });
  // The alert job is saved before the rows: if the write fails the next tick sees the stream as new again and the job is still there.
  const [first] = plan.wentLive;
  if (first && (await loadJob(hub))?.videoId !== first.id) {
    await hub.save('push-job', { videoId: first.id, title: first.title, cursor: '', startedAt: now } satisfies PushJob);
  }
  if (plan.upserts.length > 0) {
    await rest(env, 'stream_slots', { method: 'POST', query: params({ on_conflict: 'id' }), body: plan.upserts, prefer: 'resolution=merge-duplicates,return=minimal' });
  }
  if (plan.removals.length > 0) {
    await rest(env, 'stream_slots', { method: 'DELETE', query: params({ id: `in.(${plan.removals.map((id) => `"${id}"`).join(',')})` }), prefer: 'return=minimal' });
  }
  return plan.upserts.length > 0 || plan.removals.length > 0;
}

async function channelIdOf(env: Env, hub: Hub): Promise<string> {
  const saved = (await hub.load('channel-id')) as string | null;
  if (saved) return saved;
  const id = await resolveChannelId(env);
  await hub.save('channel-id', id);
  return id;
}

/** Pulls the newest uploads of each kind (3 units) and lets the database keep the window at 12 per bucket. */
export async function syncVideos(env: Env, hub: Hub): Promise<number | null> {
  const cached = (await hub.load('channel-id')) !== null;
  if (!(await hub.spendQuota(SYNC_UNITS + (cached ? 0 : 1), QUOTA_BUDGET))) return null;

  const channelId = await channelIdOf(env, hub);
  const lists = await Promise.all(VIDEO_KINDS.map((kind) => uploadsOfKind(env, channelId, kind)));
  const byId = new Map<string, VideoUpsert>(lists.flat().map((row) => [row.id, row]));
  const inserted = await rest<number>(env, 'rpc/ingest_videos', { method: 'POST', body: { p_rows: [...byId.values()] } });
  await rest(env, 'system_configs', { method: 'POST', query: params({ on_conflict: 'key' }), body: { key: 'video_backfill', value: { requested: false } }, prefer: 'resolution=merge-duplicates,return=minimal' });
  return inserted;
}

async function maybeSyncVideos(env: Env, hub: Hub): Promise<void> {
  const [config] = await rest<{ value: { requested?: unknown } }[]>(env, 'system_configs', { query: params({ select: 'value', key: 'eq.video_backfill', limit: '1' }) });
  const wanted = config?.value.requested === true && (await hub.claim('video-backfill', BACKFILL_COOLDOWN_MS));
  if (wanted || (await hub.claim('video-sync', DAY - MINUTE))) await syncVideos(env, hub);
}

/** One batch of the "Mizu is live" alert. A job lives at most half an hour, so an outage never turns into a late alert. */
async function pushBatch(env: Env, hub: Hub, now: number): Promise<void> {
  const job = await loadJob(hub);
  if (!job) return;
  if (now - job.startedAt > PUSH_JOB_TTL_MS) {
    await hub.save('push-job', null);
    return;
  }

  const limit = Math.min(PUSH_BATCH * 4, Number(env.PUSH_PER_TICK) || PUSH_BATCH);
  const query = params({ select: 'endpoint,p256dh,auth,locale', order: 'endpoint.asc', limit: String(limit) });
  if (job.cursor) query.append('endpoint', `gt.${job.cursor}`);
  const targets = await rest<Subscription[]>(env, 'push_subscriptions', { query });

  const url = `https://www.youtube.com/watch?v=${job.videoId}`;
  const results = await Promise.allSettled(targets.map((target) => sendPush(env, target, livePayload({ locale: target.locale, title: job.title, url }), now)));
  const gone = targets.filter((_, index) => {
    const result = results[index];
    return result?.status === 'fulfilled' && (result.value === 404 || result.value === 410);
  });
  if (gone.length > 0) {
    await rest(env, 'push_subscriptions', { method: 'DELETE', query: params({ endpoint: `in.(${gone.map((target) => `"${target.endpoint}"`).join(',')})` }), prefer: 'return=minimal' });
  }

  const last = targets.at(-1);
  await hub.save('push-job', targets.length < limit || !last ? null : { ...job, cursor: last.endpoint });
}

/** The cron body, once a minute. Reads the config and the schedule, polls YouTube at the pace the schedule asks for, and tells every open page what changed. */
export async function tick(env: Env, hub: Hub, now = Date.now()): Promise<void> {
  const [guerilla, known] = await Promise.all([readGuerilla(env), readSlots(env, now)]);
  let slots = known;

  if (await hub.claim('poll', pollInterval({ guerilla: guerilla.is_active, slots, now }) - TICK_SLACK_MS)) {
    try {
      if (await pollYouTube(env, hub, slots, guerilla.is_active, now)) slots = await readSlots(env, now);
    } catch (error) {
      // A YouTube outage must not stop the page updates and the alerts below.
      console.error('YouTube poll failed', error);
    }
  }

  await publishState(hub, guerilla, slots);
  await pushBatch(env, hub, now);
  // Routine synchronisation is paused while guerilla mode is on.
  if (!guerilla.is_active) await maybeSyncVideos(env, hub);
}
