/** URL codes. They double as the folder names in the build output (/en/, /jp/, /id/, /kr/). */
export const LOCALES = ['en', 'jp', 'id', 'kr'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** Where an explicit language choice is remembered, so the next visit to `/` opens in that language. */
export const LOCALE_STORAGE_KEY = 'mizu:locale';

interface LocaleInfo {
  /** The language's name in that language, shown in the language menu. */
  label: string;
  /** BCP 47 tag for <html lang>, hreflang and Intl. The URL codes jp and kr are not valid language tags. */
  htmlLang: string;
  /** Open Graph locale. */
  ogLocale: string;
}

export const localeInfo: Record<Locale, LocaleInfo> = {
  en: { label: 'English', htmlLang: 'en', ogLocale: 'en_US' },
  jp: { label: '日本語', htmlLang: 'ja', ogLocale: 'ja_JP' },
  id: { label: 'Bahasa Indonesia', htmlLang: 'id', ogLocale: 'id_ID' },
  kr: { label: '한국어', htmlLang: 'ko', ogLocale: 'ko_KR' },
};

/** Text that exists once per language, for content that lives next to its data (for example the stream schedule). */
export type Localized = Record<Locale, string>;

/** Browser language subtags mapped to the site's URL codes. `in` is the legacy tag for Indonesian. */
export const browserLanguageMap = new Map<string, Locale>([
  ['en', 'en'],
  ['ja', 'jp'],
  ['id', 'id'],
  ['in', 'id'],
  ['ko', 'kr'],
]);

export const isLocale = (value: unknown): value is Locale => LOCALES.some((locale) => locale === value);

export const localePath = (locale: Locale): string => `/${locale}/`;

export function localeFromPath(pathname: string): Locale | null {
  const code = pathname.split('/')[1];
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
