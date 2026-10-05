import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { localeFromPath } from './detect.ts';
import { I18nContext } from './i18n.ts';
import { storeLocale } from './initial.ts';
import { localeInfo, localePath, type Locale } from './locales.ts';
import { messages } from './messages/index.ts';

interface I18nProviderProps {
  initialLocale: Locale;
  children: ReactNode;
}

export function I18nProvider({ initialLocale, children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState(initialLocale);

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      storeLocale(next);
      window.history.pushState(null, '', `${localePath(next)}${window.location.search}${window.location.hash}`);
      setLocaleState(next);
    },
    [locale],
  );

  // The browser's back and forward buttons walk between languages too.
  useEffect(() => {
    const handlePopState = () => {
      const fromPath = localeFromPath(window.location.pathname);
      if (fromPath) setLocaleState(fromPath);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // The static HTML already carries the right values for the URL it was served from; this keeps them right after a switch.
  useEffect(() => {
    const { seo } = messages[locale];
    document.documentElement.lang = localeInfo[locale].htmlLang;
    document.title = seo.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', seo.description);
  }, [locale]);

  const value = useMemo(() => ({ locale, t: messages[locale], setLocale }), [locale, setLocale]);

  return <I18nContext value={value}>{children}</I18nContext>;
}
