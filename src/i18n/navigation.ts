import { useSyncExternalStore } from 'react';

const NAVIGATE_EVENT = 'mizu:navigate';

const subscribe = (onChange: () => void): (() => void) => {
  // popstate covers back and forward; NAVIGATE_EVENT covers our own pushState, which the browser does not announce.
  window.addEventListener('popstate', onChange);
  window.addEventListener(NAVIGATE_EVENT, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(NAVIGATE_EVENT, onChange);
  };
};

const getPathname = (): string => window.location.pathname;

/** The URL is the single source of truth for the language. */
export const usePathname = (): string => useSyncExternalStore(subscribe, getPathname);

/** Moves to another URL of this site without a reload. `to` is a path with an optional query and hash. */
export function navigate(to: string): void {
  const { pathname, search, hash } = window.location;
  if (to !== `${pathname}${search}${hash}`) window.history.pushState(null, '', to);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
}
