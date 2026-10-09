import { createContext, useContext } from 'react';
import type { Locale } from './locales.ts';
import type { Messages } from './messages/index.ts';

interface I18nApi {
  locale: Locale;
  t: Messages;
  setLocale: (locale: Locale) => void;
}

export const I18nContext = createContext<I18nApi | null>(null);

export function useI18n(): I18nApi {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside <I18nProvider>.');
  return context;
}
