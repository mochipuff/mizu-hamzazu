import type { StreamSlot } from '../lib/schedule.ts';

export const streamSlots: StreamSlot[] = [
  {
    id: 'gartic',
    title: '🔴『GARTIC.IO』tebak gambar apa tebak perasaan? (MABAR MEMBER)',
    description: 'Game stream',
    weekday: 0,
    time: '15:30',
    durationMinutes: 180,
    platform: 'youtube',
    membersOnly: false,
    // TODO: replace with the real thumbnail URL, e.g. https://i.ytimg.com/vi/<VIDEO_ID>/maxresdefault.jpg
    thumbnailUrl: 'https://placehold.co/1280x720/f0b863/373332/png?text=Stream+thumbnail',
  },
];
