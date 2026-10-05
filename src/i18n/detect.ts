import { isLocale, LOCALES, type Locale } from './locales.ts';

const PATH_PATTERN = new RegExp(`^/(${LOCALES.join('|')})(?:/|$)`);

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

export function localeFromBrowser(languages: readonly string[]): Locale | null {
  for (const tag of languages) {
    const locale = browserLanguageMap.get(tag.toLowerCase().split('-')[0] ?? '');
    if (locale) return locale;
  }
  return null;
}
