import { site, type ExtraProfile, type SocialPurpose } from '../config/site.ts';

type DonationPlatform = Extract<SocialPurpose, 'trakteer' | 'tako' | 'membership'>;

export interface Donation {
  name: string;
  amount: number;
  platform: DonationPlatform;
}

export interface ViewerNote {
  id: number;
  name: string;
  text: string;
}

export const formatAmount = (amount: number, language: string): string =>
  new Intl.NumberFormat(language, { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

const supportPurposes: readonly SocialPurpose[] = ['trakteer', 'tako', 'membership'];

export const supportLinks: ExtraProfile[] = site.profile.socials.filter(({ purpose }) => supportPurposes.includes(purpose));

export const platformLabel = (platform: DonationPlatform): string => site.profile.socials.find(({ purpose }) => purpose === platform)?.label ?? platform;
