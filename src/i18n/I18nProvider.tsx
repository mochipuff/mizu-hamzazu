import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { I18nContext } from './i18n.ts';
import { localeInfo, type Locale } from './locales.ts';
import { messages } from './messages/index.ts';
import { storeLocale, usePage } from './navigation.ts';
import { pagePath, pageSeo } from './pages.ts';

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const navigate = useNavigate();
  const page = usePage();

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      storeLocale(next);
      void navigate(`${pagePath(next, page)}${window.location.search}${window.location.hash}`, { viewTransition: true });
    },
    [locale, page, navigate],
  );

  useEffect(() => {
    const { title, description } = pageSeo(messages[locale], page);
    document.documentElement.lang = localeInfo[locale].htmlLang;
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  }, [locale, page]);

  const value = useMemo(() => ({ locale, t: messages[locale], setLocale }), [locale, setLocale]);

  return <I18nContext value={value}>{children}</I18nContext>;
}
