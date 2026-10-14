import { useRealtime } from '../context/realtime.ts';
import type { StreamSlot } from '../lib/schedule.ts';
import { useApi } from './api.ts';

const NO_SLOTS: StreamSlot[] = [];

/** The first answer comes from `/api/schedule/`; once the live connection delivers a snapshot, every change arrives from there. */
export function useStreamSlots(): { status: 'loading' | 'error' | 'ready'; slots: StreamSlot[] } {
  const { slots: pushed } = useRealtime();
  const { status, data } = useApi<StreamSlot[]>('/api/schedule/');
  return { status: pushed ? 'ready' : status, slots: pushed ?? data ?? NO_SLOTS };
}
