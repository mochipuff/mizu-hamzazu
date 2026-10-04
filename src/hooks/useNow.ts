import { useSyncExternalStore } from 'react';

const MINUTE_MS = 60_000;

const listeners = new Set<() => void>();
let currentTime = Date.now();
let timer: number | undefined;

// Everything that reads the clock shows minutes at most, so ticking on the minute boundary is enough.
const scheduleTick = () => {
  timer = window.setTimeout(() => {
    currentTime = Date.now();
    listeners.forEach((notify) => notify());
    scheduleTick();
  }, MINUTE_MS - (Date.now() % MINUTE_MS));
};

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  if (listeners.size === 1) {
    currentTime = Date.now();
    scheduleTick();
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.clearTimeout(timer);
  };
}

export function useNow(): number {
  return useSyncExternalStore(
    subscribe,
    () => currentTime,
    () => currentTime,
  );
}
