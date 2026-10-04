import type { StreamSlot } from '../lib/schedule.ts';

export const streamSlots: StreamSlot[] = [
  {
    id: 'nobar',
    title: '🔴『NOBAR』sapi- sapi apa yang nempel di dinding? sapidermen',
    description: 'Nonton bareng membership: spiderman into the spiderverse.',
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
    description: 'Collab stream',
    weekday: 1,
    time: '20:00',
    durationMinutes: 180,
    platform: 'youtube',
    membersOnly: false,
    thumbnailUrl: 'https://i.ytimg.com/vi/M1ANn11KH2Q/sddefault.jpg',
  },
];
