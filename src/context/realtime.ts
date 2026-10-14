import { createContext, useContext } from 'react';
import type { StreamSlot } from '../lib/schedule.ts';

/** Public address of the live Worker, no trailing slash. Without it the site simply works from its own requests. */
export const REALTIME_URL = (import.meta.env.VITE_REALTIME_URL as string | undefined)?.replace(/\/$/, '');

export interface LiveStatus {
  is_live: boolean;
  platform: 'youtube' | 'twitch';
  stream_title: string;
  url: string;
  started_at: string;
}

export interface GuerillaState {
  is_active: boolean;
  notice: string;
}

/** null means "nothing received yet" (or the live connection is not configured), so the page falls back to its own request. */
export interface RealtimeState {
  live: LiveStatus | null;
  slots: StreamSlot[] | null;
  guerilla: GuerillaState | null;
}

export const RealtimeContext = createContext<RealtimeState | null>(null);

export function useRealtime(): RealtimeState {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error('useRealtime must be used inside <RealtimeProvider>.');
  return context;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

// A message is checked before it is trusted: the page keeps working if the Worker ever sends something unexpected.
export function parseLive(data: unknown): LiveStatus | null {
  if (!isRecord(data) || typeof data.is_live !== 'boolean') return null;
  return {
    is_live: data.is_live,
    platform: data.platform === 'twitch' ? 'twitch' : 'youtube',
    stream_title: typeof data.stream_title === 'string' ? data.stream_title : '',
    url: typeof data.url === 'string' ? data.url : '',
    started_at: typeof data.started_at === 'string' ? data.started_at : '',
  };
}

export function parseGuerilla(data: unknown): GuerillaState | null {
  if (!isRecord(data) || typeof data.is_active !== 'boolean') return null;
  return { is_active: data.is_active, notice: typeof data.notice === 'string' ? data.notice : '' };
}

export function parseSlots(data: unknown): StreamSlot[] | null {
  return isRecord(data) && Array.isArray(data.slots) ? (data.slots as StreamSlot[]) : null;
}
