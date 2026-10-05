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

export const isLocale = (value: unknown): value is Locale => LOCALES.some((locale) => locale === value);

export const localePath = (locale: Locale): string => `/${locale}/`;
