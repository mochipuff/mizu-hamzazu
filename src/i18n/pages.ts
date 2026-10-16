import { isLocale, type Locale } from './locales.ts';
import type { Messages } from './messages/index.ts';

export const PAGES = ['home', 'supports', 'content', 'collab'] as const;

export const HIDDEN_PAGES = ['forbidden'] as const;

export type PublicPageId = (typeof PAGES)[number];
export type HiddenPageId = (typeof HIDDEN_PAGES)[number];
export type PageId = PublicPageId | HiddenPageId;

const SLUGS: Record<PageId, string> = { home: '', supports: 'supports', content: 'content', collab: 'collab', forbidden: 'forbidden' };

const pageBySlug = new Map<string, PageId>([...PAGES, ...HIDDEN_PAGES].map((page) => [SLUGS[page], page]));

export const isHiddenPage = (page: PageId): page is HiddenPageId => HIDDEN_PAGES.some((hidden) => hidden === page);

export const FORBIDDEN_PATH = '/forbidden/';

export const pagePath = (locale: Locale, page: PageId): string => (page === 'home' ? `/${locale}/` : `/${locale}/${SLUGS[page]}/`);

export function pageFromPath(pathname: string): PageId {
  const [, first = '', second = ''] = pathname.split('/');
  return pageBySlug.get(isLocale(first) ? second : first) ?? 'home';
}

export const pageSeo = (t: Messages, page: PageId): { title: string; description: string } => (page === 'home' ? t.seo : t[page].seo);
