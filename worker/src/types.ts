import type { LiveHub } from './hub.ts';

export interface Env {
  LIVE_HUB: DurableObjectNamespace<LiveHub>;
  LIMITER: RateLimit;
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
  YOUTUBE_API_KEY: string;
  /** Uncompressed P-256 point and its private scalar, both base64url (`npx web-push generate-vapid-keys`). */
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
  /** At least 32 characters. A caller that sends it skips the key lookup and the per-key limit (the site's own trusted services). */
  WORKER_BRIDGE_SECRET: string;
  /** Pages allowed to open the event stream and call the API, comma separated, each with https://. */
  SITE_ORIGINS: string;
  YOUTUBE_HANDLE: string;
  /** Optional. Push messages sent per cron tick; the Free plan allows 50 subrequests per invocation in total. Default 40. */
  PUSH_PER_TICK?: string;
}

export const LOCALES = ['en', 'jp', 'id', 'kr'] as const;
export type Locale = (typeof LOCALES)[number];

export type SlotStatus = 'upcoming' | 'live' | 'ended';

/** A `stream_slots` row as the site reads it. `liveStatus` is null for rows added by hand, which the Worker never touches. */
export interface SlotRow {
  id: string;
  title: string;
  description: Partial<Record<Locale, string>>;
  datetime: string;
  durationMinutes: number;
  platform: 'youtube' | 'twitch' | 'x' | 'discord';
  membersOnly: boolean;
  thumbnailUrl: string | null;
  liveStatus: SlotStatus | null;
}

export interface LiveStatusEvent {
  is_live: boolean;
  platform: 'youtube' | 'twitch';
  stream_title: string;
  url: string;
  started_at: string;
}

export interface ScheduleEvent {
  slots: SlotRow[];
}

export interface GuerillaEvent {
  is_active: boolean;
  notice: string;
}

/** The three SSE channels. Each message carries the whole state of its channel, so a missed one never leaves a page out of date. */
export interface ChannelPayloads {
  'live:status': LiveStatusEvent;
  'schedule:update': ScheduleEvent;
  'system:guerilla': GuerillaEvent;
}

export type Channel = keyof ChannelPayloads;

export interface Subscription {
  endpoint: string;
  p256dh: string;
  auth: string;
  locale: Locale;
}

export interface PushJob {
  videoId: string;
  title: string;
  /** Last endpoint of the previous batch; the next batch starts after it. */
  cursor: string;
  startedAt: number;
}

export interface ApiKeyRow {
  id: string;
  name: string;
  key_hash: string;
  scopes: string[];
  is_active: boolean;
  rate_limit_per_min: number;
}
