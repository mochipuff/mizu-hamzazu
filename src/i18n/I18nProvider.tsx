import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { localeFromPath } from './detect.ts';
import { I18nContext } from './i18n.ts';
import { storeLocale } from './initial.ts';
import { localeInfo, localePath, type Locale } from './locales.ts';
import { messages } from './messages/index.ts';
import { navigate, usePathname } from './navigation.ts';

interface I18nProviderProps {
  initialLocale: Locale;
  children: ReactNode;
}

export function I18nProvider({ initialLocale, children }: I18nProviderProps) {
  // The URL decides the language, so a switch, a shared link and the back button all go through the same path.
  const locale = localeFromPath(usePathname()) ?? initialLocale;

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      storeLocale(next);
      navigate(`${localePath(next)}${window.location.search}${window.location.hash}`);
    },
    [locale],
  );

  // The static HTML already carries the right values for the URL it was served from; this keeps them right after a switch.
  useEffect(() => {
    const { title, description } = messages[locale].seo;
    document.documentElement.lang = localeInfo[locale].htmlLang;
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  }, [locale]);

  const value = useMemo(() => ({ locale, t: messages[locale], setLocale }), [locale, setLocale]);

  return <I18nContext value={value}>{children}</I18nContext>;
}
