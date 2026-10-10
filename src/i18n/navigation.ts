import { useLocation } from 'react-router';
import { DEFAULT_LOCALE, isLocale, LOCALE_STORAGE_KEY, localeFromBrowser, type Locale } from './locales.ts';
import { pageFromPath, type PageId } from './pages.ts';

/** Which page the URL shows, whatever the language. */
export const usePage = (): PageId => pageFromPath(useLocation().pathname);

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
 * The language for a URL that has none (only possible in dev, or on an unknown path): the visitor's saved choice first,
 * then their device languages, then the default. A URL that names a language always wins, so a shared /jp/ link opens in Japanese for everyone.
 */
export const preferredLocale = (): Locale => readStoredLocale() ?? localeFromBrowser(window.navigator.languages) ?? DEFAULT_LOCALE;
