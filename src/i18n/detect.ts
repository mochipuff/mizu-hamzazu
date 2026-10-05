import { isLocale, LOCALES, type Locale } from './locales.ts';

const PATH_PATTERN = new RegExp(`^/(${LOCALES.join('|')})(?:/|$)`);

/** Browser language subtags mapped to the site's URL codes. `in` is the legacy tag for Indonesian. */
export const browserLanguageMap = new Map<string, Locale>([
  ['en', 'en'],
  ['ja', 'jp'],
  ['id', 'id'],
  ['in', 'id'],
  ['ko', 'kr'],
]);

export function localeFromPath(pathname: string): Locale | null {
  const [, code] = PATH_PATTERN.exec(pathname) ?? [];
  return isLocale(code) ? code : null;
}

/** `languages` is ordered by the visitor's preference, so the first one the site supports wins. */
export function localeFromBrowser(languages: readonly string[]): Locale | null {
  for (const tag of languages) {
    const locale = browserLanguageMap.get(tag.toLowerCase().split('-')[0] ?? '');
    if (locale) return locale;
  }
  return null;
}
