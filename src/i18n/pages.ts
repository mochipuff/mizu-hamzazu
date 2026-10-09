import { isLocale, type Locale } from './locales.ts';
import type { Messages } from './types.ts';

/** Every page of the site. Each one exists once per language: /<locale>/<slug>. */
export const PAGES = ['home', 'supports'] as const;

export type PageId = (typeof PAGES)[number];

/** The URL segment after the language. The home page has none. */
const SLUGS: Record<PageId, string> = { home: '', supports: 'supports' };

const pageBySlug = new Map<string, PageId>(PAGES.map((page) => [SLUGS[page], page]));

/** `/en/` for the home page, `/en/supports/` for the others. Always ends with a slash, like the folders in the build output. */
export const pagePath = (locale: Locale, page: PageId): string => (page === 'home' ? `/${locale}/` : `/${locale}/${SLUGS[page]}/`);

/** The path without a language: `/` or `/supports/`. This is where the visitor lands when the URL has no language yet. */
export const languageFreePath = (page: PageId): string => (page === 'home' ? '/' : `/${SLUGS[page]}/`);

/**
 * Works with and without the language: `/jp/supports/` and `/supports/` are both the supports page.
 * Unknown paths show the home page, as they always did.
 */
export function pageFromPath(pathname: string): PageId {
  const [, first = '', second = ''] = pathname.split('/');
  return pageBySlug.get(isLocale(first) ? second : first) ?? 'home';
}

export const pageSeo = (t: Messages, page: PageId): { title: string; description: string } => (page === 'supports' ? t.supports.seo : t.seo);
