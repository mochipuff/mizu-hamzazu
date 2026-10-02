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

export const profileFacts: ProfileFact[] = [
  { label: 'Species', value: 'Hamster' },
  { label: 'Birthday', value: 'Gak tau :(' },
  { label: 'Height', value: '154 cm' },
  { label: 'Debut', value: 'Nov 1, 2021' },
  { label: 'Fan name', value: 'Zutopian' },
];

export const lore: string[] = [
  'Ayah siapa itu mizu?',
  'The goat.',
];

export const likes: string[] = ['Sukanya apa ju?'];

export const dislikes: string[] = ['Ada hal yang kamu gak suka?'];

export const marqueeLines: string[] = [
  'Kangen? Ngobrol di discord yuk',
  'Support aku via TrakTeer ya',
  'Join member sabi sih',
  'Mizu Hamzazu',
  'Zutopian',
  'EITS gak nih?',
];

export const perks: Perk[] = [
  { title: 'Member badge and emotes', description: 'Sesi nonton bareng, main bareng dan livestream exclusive.' },
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
