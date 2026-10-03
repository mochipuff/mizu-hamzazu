import { isFilled, site } from '../config/site.ts';
import { membershipTiers, type MembershipTier } from './membership.ts';

export interface NavItem {
  id: string;
  label: string;
}

export interface ProfileFact {
  label: string;
  value: string;
}

export interface Perk {
  title: string;
  description: string;
  /** Optional membership tiers whose badges float inside the card. */
  tiers?: readonly MembershipTier[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export const navItems: NavItem[] = [
  { id: 'about', label: 'About' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'emotes', label: 'Emotes' },
  { id: 'join', label: 'Join' },
  { id: 'faq', label: 'FAQ' },
  { id: 'contact', label: 'Contact' },
];

const formatDate = (isoDate: string): string =>
  isFilled(isoDate) ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(isoDate)) : isoDate;

/** Built from `site.profile`, so the page and the search/AI output can never disagree. Unfilled TODO values are skipped. */
export const profileFacts: ProfileFact[] = [
  { label: 'Species', value: site.profile.species },
  { label: 'Birthday', value: formatDate(site.profile.birthday) },
  { label: 'Height', value: `${site.profile.heightCm} cm` },
  { label: 'Debut', value: formatDate(site.profile.debut) },
  { label: 'Fan name', value: site.fanName },
].filter(({ value }) => isFilled(value));

export const lore: string[] = [
  'Ayah siapa itu mizu?',
  'The goat.',
];

export const likes: string[] = ['Fikk', 'Valorant', 'Minecraft', 'Tomodachi life', 'Sushi', 'Cimol', 'Spicy food', 'Matcha', 'Coffee', 'Teazzi'];

export const dislikes: string[] = ['Insect', 'Horror games', 'Thunderstorm', 'Makanan mint'];

export const marqueeLines: string[] = [
  'Kangen? Ngobrol di discord yuk',
  'Support aku via Trakteer ya',
  'Join member sabi sih',
  'Mizu Hamzazu',
  'Zutopian',
  'EITS gak nih?',
];

export const perks: Perk[] = [
  {
    title: 'Member badge and emotes',
    description: 'Sesi nonton bareng, main bareng dan livestream exclusive.',
    tiers: membershipTiers,
  },
  { title: 'VOD Hayden James', description: 'Roleplay jadi pacar pas sleepcall?' },
  { title: 'Discord channels', description: 'Unlock channel exclusive member dan nonton bareng di discord.' },
  { title: 'Dapat info A1 lebih cepat', description: 'Dapat informasi terkait mizu lebih cepat, wow!' },
];

export const faqItems: FaqItem[] = [
  {
    question: 'When does Mizu stream?',
    answer:
      'Sesuai jadwal tertera diatas dan schedule di discord server.',
  },
  {
    question: 'What does Mizu stream?',
    answer:
      'Mostly cozy games, karaoke, tierlist, freetalk, dan produktif stream #RABUATIF.',
  },
];

export const contactTopics: string[] = ['Collaboration', 'Sponsorship', 'Press or interview', 'Something else'];
