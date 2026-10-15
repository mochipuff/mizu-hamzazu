import { useLocation } from 'react-router';
import { DEFAULT_LOCALE, isLocale, LOCALE_STORAGE_KEY, localeFromBrowser, type Locale } from './locales.ts';
import { pageFromPath, type PageId } from './pages.ts';

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
  }
}

export const preferredLocale = (): Locale => readStoredLocale() ?? localeFromBrowser(window.navigator.languages) ?? DEFAULT_LOCALE;
