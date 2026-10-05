import type { StreamSlot } from '../lib/schedule.ts';

/** `title` is the real title of the stream on YouTube, so it stays as published. `description` is ours and is translated. */
export const streamSlots: StreamSlot[] = [
  {
    id: 'nobar',
    title: '🔴『NOBAR』sapi- sapi apa yang nempel di dinding? sapidermen',
    description: {
      en: 'Membership watch-along: Spider-Man: Into the Spider-Verse.',
      jp: 'メンバーシップ同時視聴会：『スパイダーマン：スパイダーバース』。',
      id: 'Nonton bareng membership: spiderman into the spiderverse.',
      kr: '멤버십 함께 보기: 스파이더맨: 뉴 유니버스.',
    },
    weekday: 1,
    time: '15:30',
    durationMinutes: 180,
    platform: 'youtube',
    membersOnly: true,
    thumbnailUrl: 'https://i.ytimg.com/vi/cMDddZKhy8w/sddefault.jpg',
  },
  {
    id: 'phasmo',
    title: '🔴『PHASMOPHOBIA』nakutin atau ditakutin? ft. @SilveragonAri @RayRxyz',
    description: {
      en: 'Collab stream',
      jp: 'コラボ配信',
      id: 'Collab stream',
      kr: '콜라보 방송',
    },
    weekday: 1,
    time: '20:00',
    durationMinutes: 150,
    platform: 'youtube',
    membersOnly: false,
    thumbnailUrl: 'https://i.ytimg.com/vi/M1ANn11KH2Q/sddefault.jpg',
  },
];
