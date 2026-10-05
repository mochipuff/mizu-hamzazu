import { getContactEmail, isFilled, site } from '../config/site.ts';
import { localeInfo, type Locale } from '../i18n/locales.ts';
import type { Messages } from '../i18n/types.ts';
import { membershipTiers, type MembershipTier } from './membership.ts';

// The contact section is only rendered once a real business address is configured, so its link is hidden until then.
export const navIds = (['about', 'schedule', 'emotes', 'join', 'faq', 'contact'] as const).filter((id) => id !== 'contact' || getContactEmail());

export interface ProfileFact {
  label: string;
  value: string;
}

export interface OfficialProfile {
  label: string;
  url: string;
  purpose: string;
}

export interface Perk {
  id: keyof Messages['join']['perks'];
  /** Optional membership tiers whose badges float inside the card. */
  tiers?: readonly MembershipTier[];
}

export const perks: Perk[] = [{ id: 'membership', tiers: membershipTiers }, { id: 'vod' }, { id: 'discord' }, { id: 'info' }];

export const contactTopicIds = ['collaboration', 'sponsorship', 'press', 'other'] as const;

const formatDate = (isoDate: string, language: string): string =>
  isFilled(isoDate) ? new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(isoDate)) : isoDate;

const formatMonthDay = (monthDay: string, language: string): string => {
  if (!isFilled(monthDay)) return monthDay;
  const [month = 1, day = 1] = monthDay.split('-').map(Number);
  // 2000 is a leap year, so 02-29 stays valid.
  return new Intl.DateTimeFormat(language, { month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(2000, month - 1, day)));
};

/** Built from `site.profile` and the messages, so the page and the search/AI output can never disagree. Unfilled TODO values are skipped. */
export function getProfileFacts(locale: Locale, t: Messages): ProfileFact[] {
  const language = localeInfo[locale].htmlLang;
  const { labels } = t.profile;
  return [
    { label: labels.species, value: t.profile.species },
    { label: labels.birthday, value: formatMonthDay(site.profile.birthday, language) },
    { label: labels.height, value: `${site.profile.heightCm} cm` },
    { label: labels.debut, value: formatDate(site.profile.debut, language) },
    { label: labels.fanName, value: site.fanName },
  ].filter(({ value }) => isFilled(value));
}

/** Every platform and social link with its purpose written in the current language. */
export const getOfficialProfiles = (t: Messages): OfficialProfile[] =>
  [
    ...site.platforms.map(({ id, label, url }) => ({ label, url, purpose: t.platforms[id].blurb })),
    ...site.profile.socials.map(({ label, url, purpose }) => ({ label, url, purpose: t.socials[purpose] })),
  ].filter(({ url }) => isFilled(url));
