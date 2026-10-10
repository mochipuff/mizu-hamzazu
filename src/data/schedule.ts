import type { StreamSlot } from '../lib/schedule.ts';
import { useApi } from './api.ts';

const NO_SLOTS: StreamSlot[] = [];

export function useStreamSlots(): { status: 'loading' | 'error' | 'ready'; slots: StreamSlot[] } {
  const { status, data } = useApi<StreamSlot[]>('/api/schedule/');
  return { status, slots: data ?? NO_SLOTS };
}
