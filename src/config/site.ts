import type { Messages } from '../i18n/types.ts';

export type PlatformId = 'youtube' | 'twitch' | 'x' | 'discord';

/** The call to action and blurb of each platform live in the messages (`platforms.<id>`). */
export interface Platform {
  id: PlatformId;
  label: string;
  handle: string;
  url: string;
  liveUrl: string;
}

export type HashtagPurpose = keyof Messages['hashtags'];
export type SocialPurpose = keyof Messages['socials'];

export interface Hashtag {
  tag: string;
  purpose: HashtagPurpose;
}

export interface ExtraProfile {
  label: string;
  url: string;
  purpose: SocialPurpose;
}

/**
 * Facts that are the same in every language. Anything that has words (bio, species, languages, ...) is in `src/i18n/messages`.
 * Any value starting with "TODO" is skipped everywhere it would be published.
 */
export interface Profile {
  debut: string;
  heightCm: number;
  birthday: string;
  illustrator: string;
  riggerOrModeler: string;
  alternateNames: string[];
  /** No agency: the translated `agency` label ("Independent") is shown on the page but never published as an organization. */
  independent: boolean;
  socials: ExtraProfile[];
}

export interface SiteConfig {
  name: string;
  nickname: string;
  fanName: string;
  copyrightOwner: string;
  themeColor: string;
  scheduleTimeZone: string;
  seo: {
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
  fanName: 'Zutopian',
  copyrightOwner: 'Fikk@MizuHamzazu',
  themeColor: '#daa047',
  scheduleTimeZone: 'Asia/Jakarta',
  seo: {
    image: { path: '/og-image.png', width: 1200, height: 630 },
    allowAiCrawlers: true,
  },
  profile: {
    debut: '2021-11-01',
    heightCm: 165,
    birthday: '03-12',
    illustrator: 'TODO: character illustrator',
    riggerOrModeler: 'Ardi Sketch and Gromb Yan',
    alternateNames: ['Mizu', 'Hamzazu', 'みず'],
    independent: true,
    socials: [
      { label: 'Instagram', url: 'https://www.instagram.com/mizuhamzazu', purpose: 'instagram' },
      { label: 'TikTok', url: 'https://www.tiktok.com/ZS9DA53nU9Tua-D8heE/', purpose: 'tiktok' },
      { label: 'Trakteer', url: 'https://trakteer.id/MizuHamzazu', purpose: 'trakteer' },
      { label: 'Linktree', url: 'https://linktr.ee/MizuHamzazu', purpose: 'linktree' },
      { label: 'Tako', url: 'https://tako.id/MizuHamzazu/gift', purpose: 'tako' },
      { label: 'Youtube Membership', url: 'https://youtube.com/@MizuHamzazu/join', purpose: 'membership' },
    ],
  },
  hashtags: [
    { tag: '#DekMizu', purpose: 'general' },
    { tag: '#forMizu', purpose: 'fanart' },
    { tag: '#Mizuislive', purpose: 'live' },
    { tag: '#Mizungelag', purpose: 'meme' },
    { tag: '#MizuClips', purpose: 'clips' },
  ],
  platforms: [
    {
      id: 'youtube',
      label: 'YouTube',
      handle: '@MizuHamzazu',
      url: 'https://www.youtube.com/@MizuHamzazu',
      liveUrl: 'https://www.youtube.com/@MizuHamzazu/live',
    },
    {
      id: 'twitch',
      label: 'Twitch',
      handle: 'mizuhamzazu',
      url: 'https://www.twitch.tv/mizuhamzazu',
      liveUrl: 'https://www.twitch.tv/mizuhamzazu',
    },
    {
      id: 'x',
      label: 'X',
      handle: '@MizuHamzazu',
      url: 'https://x.com/MizuHamzazu',
      liveUrl: 'https://x.com/MizuHamzazu',
    },
    {
      id: 'discord',
      label: 'Discord',
      handle: 'Hamzazu Palace🐹',
      url: 'https://discord.gg/ahQhrK4yPq',
      liveUrl: 'https://discord.gg/ahQhrK4yPq',
    },
  ],
};

const platformById = new Map(site.platforms.map((platform) => [platform.id, platform]));

export const getPlatform = (id: PlatformId): Platform | undefined => platformById.get(id);

export const isFilled = (value: string | undefined): value is string => Boolean(value) && !value?.startsWith('TODO');

export const profileUrls = (): string[] =>
  [...site.platforms.map(({ url }) => url), ...site.profile.socials.map(({ url }) => url)].filter(isFilled);
