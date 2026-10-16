import { isLocale, type Locale } from './locales.ts';
import type { Messages } from './messages/index.ts';

/** Every page of the site that search engines may list. Each one exists once per language: /<locale>/<slug>. */
export const PAGES = ['home', 'supports', 'content', 'collab'] as const;

/** Pages a visitor can land on but that are never published: no sitemap entry, no hreflang, `noindex`. */
export const HIDDEN_PAGES = ['forbidden'] as const;

export type PublicPageId = (typeof PAGES)[number];
export type HiddenPageId = (typeof HIDDEN_PAGES)[number];
export type PageId = PublicPageId | HiddenPageId;

/** The URL segment after the language. The home page has none. */
const SLUGS: Record<PageId, string> = { home: '', supports: 'supports', content: 'content', collab: 'collab', forbidden: 'forbidden' };

const pageBySlug = new Map<string, PageId>([...PAGES, ...HIDDEN_PAGES].map((page) => [SLUGS[page], page]));

export const isHiddenPage = (page: PageId): page is HiddenPageId => HIDDEN_PAGES.some((hidden) => hidden === page);

/**
 * Where the API (`api/index.ts`) and `vercel.json` send a visitor who opens an API address in the browser.
 * It has no language: the app moves the visitor on to `/<locale>/forbidden/`.
 */
export const FORBIDDEN_PATH = '/forbidden/';

/** `/en/` for the home page, `/en/supports/` for the others. Always ends with a slash, like the folders in the build output. */
export const pagePath = (locale: Locale, page: PageId): string => (page === 'home' ? `/${locale}/` : `/${locale}/${SLUGS[page]}/`);

/**
 * Works with and without the language: `/jp/supports/` and `/supports/` are both the supports page.
 * Unknown paths show the home page, as they always did.
 */
export function pageFromPath(pathname: string): PageId {
  const [, first = '', second = ''] = pathname.split('/');
  return pageBySlug.get(isLocale(first) ? second : first) ?? 'home';
}

export const pageSeo = (t: Messages, page: PageId): { title: string; description: string } => (page === 'home' ? t.seo : t[page].seo);
