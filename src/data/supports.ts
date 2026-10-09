import { site, type ExtraProfile, type SocialPurpose } from '../config/site.ts';

type DonationPlatform = Extract<SocialPurpose, 'trakteer' | 'tako' | 'membership'>;

export interface Donation {
  name: string;
  amount: number;
  platform: DonationPlatform;
}

const TOP_COUNT = 10;

const donations: readonly Donation[] = [
  { name: 'Nathsuzashyee', amount: 1_500_000, platform: 'trakteer' },
  { name: 'Cupa', amount: 1_000_000, platform: 'tako' },
  { name: 'Hoshi', amount: 750_000, platform: 'trakteer' },
  { name: 'Avety', amount: 500_000, platform: 'membership' },
  { name: 'ZenZen', amount: 350_000, platform: 'trakteer' },
  { name: 'Willy', amount: 300_000, platform: 'tako' },
  { name: 'Ex', amount: 250_000, platform: 'trakteer' },
  { name: 'Redd', amount: 200_000, platform: 'membership' },
  { name: 'Marc', amount: 150_000, platform: 'tako' },
  { name: 'Seseorang', amount: 100_000, platform: 'trakteer' },
];

export const viewerNotes: readonly { name: string; text: string }[] = [
  { name: 'Fikk', text: 'Semangat streaming dan bikin kontennya, btw mizu kangen.' },
];

export const getTopDonations = (): Donation[] => [...donations].sort((a, b) => b.amount - a.amount).slice(0, TOP_COUNT);

export const formatAmount = (amount: number, language: string): string =>
  new Intl.NumberFormat(language, { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

const supportPurposes: readonly SocialPurpose[] = ['trakteer', 'tako', 'membership'];

export const supportLinks: ExtraProfile[] = site.profile.socials.filter(({ purpose }) => supportPurposes.includes(purpose));

export const platformLabel = (platform: DonationPlatform): string => site.profile.socials.find(({ purpose }) => purpose === platform)?.label ?? platform;
