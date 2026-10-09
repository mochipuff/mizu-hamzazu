import { isFilled, site, type ExtraProfile, type SocialPurpose } from '../config/site.ts';

export type DonationPlatform = Extract<SocialPurpose, 'trakteer' | 'tako' | 'membership'>;

export interface Donation {
  name: string;
  /** In Indonesian rupiah. */
  amount: number;
  platform: DonationPlatform;
}

export interface ViewerNote {
  name: string;
  text: string;
}

export const TOP_COUNT = 10;

// TODO: sample data. Replace it with the real supporters and notes (an export from Trakteer / Tako, or a fetch from your own endpoint).
const donations: readonly Donation[] = [
  { name: 'Hamu_Hamu', amount: 1_500_000, platform: 'trakteer' },
  { name: 'Kopi Susu', amount: 1_000_000, platform: 'tako' },
  { name: 'Nanami', amount: 750_000, platform: 'trakteer' },
  { name: 'Captain Biji', amount: 500_000, platform: 'membership' },
  { name: 'Rindu', amount: 350_000, platform: 'trakteer' },
  { name: 'Mochi', amount: 300_000, platform: 'tako' },
  { name: 'Aoi', amount: 250_000, platform: 'trakteer' },
  { name: 'Sunny', amount: 200_000, platform: 'membership' },
  { name: 'Pixel', amount: 150_000, platform: 'tako' },
  { name: 'Tiramisu', amount: 100_000, platform: 'trakteer' },
  { name: 'Pak Zuto', amount: 75_000, platform: 'trakteer' },
  { name: 'Ayam Geprek', amount: 50_000, platform: 'tako' },
];

// TODO: sample data, see above. Notes are written by viewers, so they stay in the language they were written in.
export const viewerNotes: readonly ViewerNote[] = [
  { name: 'Kopi Susu', text: 'Streammu bikin akhir pekanku jadi lebih hangat. Semangat terus ya, Mizu!' },
  { name: 'Sunny', text: 'Your karaoke streams are my favorite way to end a long day.' },
  { name: 'Aoi', text: 'いつも癒やしをありがとう！次の歌枠も楽しみにしてます♪' },
  { name: 'Nanami', text: '항상 응원하고 있어요! 건강 잘 챙기세요.' },
  { name: 'Rindu', text: 'Kincirnya jangan berhenti muter ya, aku nonton dari kamar kos tiap malam.' },
  { name: 'Pixel', text: 'Thank you for being so kind to everyone in chat.' },
  { name: 'Mochi', text: 'Semoga adiknya cepat ketemu ya, Mizu!' },
  { name: 'Captain Biji', text: 'First time sending a treat and I am so nervous. Keep being you!' },
];

export const getTopDonations = (): Donation[] => [...donations].sort((a, b) => b.amount - a.amount).slice(0, TOP_COUNT);

export const formatAmount = (amount: number, language: string): string =>
  new Intl.NumberFormat(language, { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

const supportPurposes: readonly SocialPurpose[] = ['trakteer', 'tako', 'membership'];

/** The places where viewers can send a treat, taken from the site config so the links live in one place. */
export const supportLinks: ExtraProfile[] = site.profile.socials.filter(({ purpose, url }) => supportPurposes.includes(purpose) && isFilled(url));

export const platformLabel = (platform: DonationPlatform): string => site.profile.socials.find(({ purpose }) => purpose === platform)?.label ?? platform;
