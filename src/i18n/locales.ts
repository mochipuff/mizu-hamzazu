export const LOCALES = ['en', 'jp', 'id'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_STORAGE_KEY = 'mizu:locale';

interface LocaleInfo {
  label: string;
  htmlLang: string;
  ogLocale: string;
}

export const localeInfo: Record<Locale, LocaleInfo> = {
  en: { label: 'English', htmlLang: 'en', ogLocale: 'en_US' },
  jp: { label: '日本語', htmlLang: 'ja', ogLocale: 'ja_JP' },
  id: { label: 'Bahasa Indonesia', htmlLang: 'id', ogLocale: 'id_ID' },
};

export type Localized = Record<Locale, string>;

export const browserLanguageMap = new Map<string, Locale>([
  ['en', 'en'],
  ['ja', 'jp'],
  ['id', 'id'],
  ['in', 'id'],
]);

export const isLocale = (value: unknown): value is Locale => LOCALES.some((locale) => locale === value);

export const localePath = (locale: Locale): string => `/${locale}/`;

export function localeFromPath(pathname: string): Locale | null {
  const code = pathname.split('/')[1];
  return isLocale(code) ? code : null;
}

export function localeFromBrowser(languages: readonly string[]): Locale | null {
  for (const tag of languages) {
    const locale = browserLanguageMap.get(tag.toLowerCase().split('-')[0] ?? '');
    if (locale) return locale;
  }
  return null;
}
