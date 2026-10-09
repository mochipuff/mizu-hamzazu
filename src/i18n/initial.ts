import { localeFromBrowser, localeFromPath } from './detect.ts';
import { DEFAULT_LOCALE, isLocale, LOCALE_STORAGE_KEY, type Locale } from './locales.ts';
import { pageFromPath, pagePath } from './pages.ts';

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
export function resolveInitialLocale(): Locale {
  const fromPath = localeFromPath(window.location.pathname);
  if (fromPath) return fromPath;

  const locale = readStoredLocale() ?? localeFromBrowser(window.navigator.languages) ?? DEFAULT_LOCALE;
  const page = pageFromPath(window.location.pathname);
  window.history.replaceState(null, '', `${pagePath(locale, page)}${window.location.search}${window.location.hash}`);
  return locale;
}
