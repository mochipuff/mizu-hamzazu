import { site } from '../config/site.ts';
import { localeInfo, type Locale } from '../i18n/locales.ts';
import type { Messages } from '../i18n/messages/index.ts';

const formatDate = (isoDate: string, language: string): string =>
  new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(isoDate));

const formatMonthDay = (monthDay: string, language: string): string => {
  const [month = 1, day = 1] = monthDay.split('-').map(Number);
  return new Intl.DateTimeFormat(language, { month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(2000, month - 1, day)));
};

export function getProfileFacts(locale: Locale, t: Messages): { label: string; value: string }[] {
  const language = localeInfo[locale].htmlLang;
  const { labels } = t.profile;
  return [
    { label: labels.species, value: t.profile.species },
    { label: labels.birthday, value: formatMonthDay(site.profile.birthday, language) },
    { label: labels.height, value: `${site.profile.heightCm} cm` },
    { label: labels.debut, value: formatDate(site.profile.debut, language) },
    { label: labels.fanName, value: site.fanName },
  ];
}
