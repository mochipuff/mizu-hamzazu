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
  };
  hashtags: Hashtag[];
  platforms: Platform[];
}

export const site: SiteConfig = {
  name: 'Mizu Hamzazu',
  nickname: 'Mizu Hamzazu',
  fanName: 'Kacangers',
  language: 'en',
  locale: 'en_ID',
  themeColor: '#daa047',
  scheduleTimeZone: 'Asia/Jakarta',
  contactEmail: 'business@mizu.id',
  seo: {
    title: 'Mizu Hamzazu | Virtual Streamer, Schedule & Emotes',
    description:
      'Meet Mizu Hamzazu, an Indonesian virtual streamer who plays cozy games and sings karaoke.',
    imageAlt: 'Mizu Hamzazu, a hamster virtual streamer',
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
