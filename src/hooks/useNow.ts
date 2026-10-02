import { useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();
let currentTime = Date.now();
let timer: number | undefined;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  if (listeners.size === 1) {
    currentTime = Date.now();
    timer = window.setInterval(() => {
      currentTime = Date.now();
      listeners.forEach((notify) => notify());
    }, 1000);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.clearInterval(timer);
  };
}

export function useNow(): number {
  return useSyncExternalStore(
    subscribe,
    () => currentTime,
    () => currentTime,
  );
}
