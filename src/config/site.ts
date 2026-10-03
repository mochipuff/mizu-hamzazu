export type PlatformId = 'youtube' | 'twitch' | 'x' | 'discord';

export interface Platform {
  id: PlatformId;
  label: string;
  handle: string;
  url: string;
  liveUrl: string;
  cta: string;
  blurb: string;
}

export interface Hashtag {
  tag: string;
  purpose: string;
}

export interface ExtraProfile {
  label: string;
  url: string;
  purpose: string;
}

/** Facts for search engines and AI crawlers. Any value starting with "TODO" is skipped everywhere it would be published. */
export interface Profile {
  tagline: string;
  bio: string;
  species: string;
  nationality: string;
  debut: string;
  heightCm: number;
  birthday: string;
  agency: string;
  illustrator: string;
  riggerOrModeler: string;
  alternateNames: string[];
  languages: string[];
  topics: string[];
  socials: ExtraProfile[];
}

export interface SiteConfig {
  name: string;
  nickname: string;
  fanName: string;
  language: string;
  locale: string;
  themeColor: string;
  scheduleTimeZone: string;
  contactEmail: string;
  seo: {
    title: string;
    description: string;
    imageAlt: string;
    keywords: string[];
    image: { path: string; width: number; height: number };
    allowAiCrawlers: boolean;
  };
  profile: Profile;
  hashtags: Hashtag[];
  platforms: Platform[];
}

export const site: SiteConfig = {
  name: 'Mizu Hamzazu',
  nickname: 'Mizu Hamzazu',
  fanName: 'TODO: fan name',
  language: 'en',
  locale: 'en_ID',
  themeColor: '#daa047',
  scheduleTimeZone: 'Asia/Jakarta',
  contactEmail: 'TODO: business@mizu.id',
  seo: {
    title: 'Mizu Hamzazu | VT',
    description:
      'Meet Mizu Hamzazu, an Indonesian virtual youtuber.',
    imageAlt: 'Mizu Hamzazu, an Indonesian virtual youtuber',
    keywords: ['Mizu Hamzazu', 'VTuber Indonesia', 'Indonesian virtual youtuber', 'hamster VTuber', 'Zutopian', 'cozy gaming', 'karaoke stream'],
    image: { path: '/og-image.png', width: 1200, height: 630 },
    allowAiCrawlers: true,
  },
  profile: {
    tagline: 'Indonesian hamster VTuber: freetalk, cozy games and karaoke.',
    bio: 'Mizu Hamzazu is an Indonesian virtual youtuber (VTuber) who debuted on November 1, 2021. She is a hamster who streams freetalk, cozy games, karaoke and the productive #RABUATIF stream on YouTube and Twitch, and hangs out with her fans, the Zutopian, in the Hamzazu Palace Discord.',
    species: 'Hamster',
    nationality: 'Indonesia',
    debut: '2021-11-01',
    heightCm: 154,
    birthday: 'TODO: YYYY-MM-DD',
    agency: 'TODO: agency name, or leave as is for independent',
    illustrator: 'TODO: character illustrator',
    riggerOrModeler: 'TODO: Live2D rigger or 3D modeler',
    alternateNames: ['Mizu', 'Hamzazu', 'みず', 'TODO: Japanese or other alias'],
    languages: ['Indonesian', 'English'],
    topics: ['Virtual YouTubers', 'Cozy games', 'Karaoke', 'Freetalk streams', 'Indonesian VTuber community'],
    socials: [
      { label: 'Instagram', url: 'https://www.instagram.com/mizuhamzazu', purpose: 'Photos and updates' },
      { label: 'TikTok', url: 'TODO: https://www.tiktok.com/@your-handle', purpose: 'Short clips' },
      { label: 'Trakteer', url: 'TODO: https://trakteer.id/your-handle', purpose: 'Support and donations' },
      { label: 'Linktree', url: 'TODO: https://linktr.ee/your-handle', purpose: 'All links in one place' },
    ],
  },
  hashtags: [
    { tag: '#MizuHamzazu', purpose: 'General posts' },
    { tag: '#MizuArt', purpose: 'Fan art' },
    { tag: '#MizuLive', purpose: 'Live reactions' },
    { tag: '#MizuClips', purpose: 'Clips and highlights' },
  ],
  platforms: [
    {
      id: 'youtube',
      label: 'YouTube',
      handle: '@MizuHamzazu',
      url: 'https://www.youtube.com/@MizuHamzazu',
      liveUrl: 'https://www.youtube.com/@MizuHamzazu/live',
      cta: 'Watch on YouTube',
      blurb: 'Freetalk and gaming stream.',
    },
    {
      id: 'twitch',
      label: 'Twitch',
      handle: 'mizuhamzazu',
      url: 'https://www.twitch.tv/mizuhamzazu',
      liveUrl: 'https://www.twitch.tv/mizuhamzazu',
      cta: 'Watch on Twitch',
      blurb: 'Freetalk stream with lang EN.',
    },
    {
      id: 'x',
      label: 'X',
      handle: '@MizuHamzazu',
      url: 'https://x.com/MizuHamzazu',
      liveUrl: 'https://x.com/MizuHamzazu',
      cta: 'Follow on X',
      blurb: 'All about mizu.',
    },
    {
      id: 'discord',
      label: 'Discord',
      handle: 'Hamzazu Palace🐹',
      url: 'https://discord.gg/ahQhrK4yPq',
      liveUrl: 'https://discord.gg/ahQhrK4yPq',
      cta: 'Join the Discord',
      blurb: 'Chat with other Zutopian.',
    },
  ],
};

export const isFilled = (value: string | undefined): value is string => Boolean(value) && !value?.startsWith('TODO');

export const profileUrls = (): string[] =>
  [...site.platforms.map(({ url }) => url), ...site.profile.socials.map(({ url }) => url)].filter(isFilled);