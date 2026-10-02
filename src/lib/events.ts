const SPLASH_EVENT = 'mizu:splash';

export function triggerSplash(): void {
  window.dispatchEvent(new Event(SPLASH_EVENT));
}

export function onSplash(listener: () => void): () => void {
  window.addEventListener(SPLASH_EVENT, listener);
  return () => window.removeEventListener(SPLASH_EVENT, listener);
}
