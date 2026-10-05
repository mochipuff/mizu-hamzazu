import { localeFromBrowser, localeFromPath } from './detect.ts';
import { DEFAULT_LOCALE, isLocale, LOCALE_STORAGE_KEY, localePath, type Locale } from './locales.ts';

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
 * then their device languages, then the default. The address bar is rewritten to match.
 */
export function resolveInitialLocale(): Locale {
  const fromPath = localeFromPath(window.location.pathname);
  if (fromPath) return fromPath;

  const locale = readStoredLocale() ?? localeFromBrowser(window.navigator.languages) ?? DEFAULT_LOCALE;
  window.history.replaceState(null, '', `${localePath(locale)}${window.location.search}${window.location.hash}`);
  return locale;
}
