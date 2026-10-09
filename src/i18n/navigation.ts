import { useSyncExternalStore } from 'react';
import { DEFAULT_LOCALE, isLocale, LOCALE_STORAGE_KEY, localeFromBrowser, localeFromPath, type Locale } from './locales.ts';
import { pageFromPath, pagePath, type PageId } from './pages.ts';

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

/** Which page the URL shows, whatever the language. */
export const usePage = (): PageId => pageFromPath(usePathname());

/** Moves to another URL of this site without a reload. `to` is a path with an optional query and hash. */
export function navigate(to: string): void {
  const { pathname, search, hash } = window.location;
  if (to !== `${pathname}${search}${hash}`) window.history.pushState(null, '', to);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
}

const readStoredLocale = (): Locale | null => {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(stored) ? stored : null;
  } catch {
    return null;
  }
};

export function storeLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* storage is unavailable; the choice simply won't persist */
  }
}

/**
 * The URL always wins, so a shared /jp/ link opens in Japanese for everyone.
 * Without a language in the URL (only possible in dev, or on an unknown path) the visitor's saved choice comes first,
 * then their device languages, then the default. The address bar is rewritten to match and keeps the page, so /supports/ becomes /jp/supports/.
 */
export function ensureLocaleInUrl(): void {
  const { pathname, search, hash } = window.location;
  if (localeFromPath(pathname)) return;

  const locale = readStoredLocale() ?? localeFromBrowser(window.navigator.languages) ?? DEFAULT_LOCALE;
  window.history.replaceState(null, '', `${pagePath(locale, pageFromPath(pathname))}${search}${hash}`);
}
