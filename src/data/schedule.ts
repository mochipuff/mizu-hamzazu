import { useEffect, useState } from 'react';
import type { StreamSlot } from '../lib/schedule.ts';

// Hero and Schedule both need the list; they share one request. A failed request is forgotten so the next mount tries again.
let request: Promise<StreamSlot[]> | undefined;

function loadStreamSlots(): Promise<StreamSlot[]> {
  request ??= fetch('/api/schedule/')
    .then((response) => {
      if (!response.ok) throw new Error(`Schedule request failed: ${response.status}`);
      return response.json() as Promise<StreamSlot[]>;
    })
    .catch((error: unknown) => {
      request = undefined;
      throw error;
    });
  return request;
}

type StreamSlotsState = { status: 'loading'; slots: [] } | { status: 'error'; slots: [] } | { status: 'ready'; slots: StreamSlot[] };

export function useStreamSlots(): StreamSlotsState {
  const [state, setState] = useState<StreamSlotsState>({ status: 'loading', slots: [] });

  useEffect(() => {
    let active = true;
    loadStreamSlots().then(
      (slots) => active && setState({ status: 'ready', slots }),
      () => active && setState({ status: 'error', slots: [] }),
    );
    return () => {
      active = false;
    };
  }, []);

  return state;
}
