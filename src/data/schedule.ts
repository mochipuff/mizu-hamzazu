import type { StreamSlot } from '../lib/schedule.ts';

export const streamSlots: StreamSlot[] = [
  {
    id: 'morning-stream',
    title: '🔴『MORNING STREAM』Bangun Tidur Langsung Yapping',
    description: 'Morning person, cit chat freetalk.',
    weekday: 5,
    time: '09:00',
    durationMinutes: 180,
    platform: 'youtube',
    membersOnly: false,
  },
  {
    id: 'until-then',
    title: '🔴『UNTIL THEN』Lanjutin cerita yang semakin bingungin',
    description: 'Melanjutkan story yang makin bikin bingung.',
    weekday: 6,
    time: '09:00',
    durationMinutes: 180,
    platform: 'youtube',
    membersOnly: false,
  },
  {
    id: 'gartic',
    title: '🔴『GARTIC.IO』tebak gambar apa tebak perasaan? (MABAR MEMBER)',
    description: 'Game stream',
    weekday: 7,
    time: '15:30',
    durationMinutes: 180,
    platform: 'youtube',
    membersOnly: false,
  },
];
