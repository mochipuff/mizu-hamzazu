import type { StreamSlot } from '../lib/schedule.ts';

export const streamSlots: StreamSlot[] = [
  {
    id: 'untilthen',
    title: '🔴『UNTIL THEN』kelanjutan setelah ketemu anak baru',
    description: {
      en: 'Game Stream',
      jp: 'ゲーム生配信スケジュール',
      id: 'Stream main game',
      kr: '게임 생방송 일정',
    },
    weekday: 4,
    time: '08:00',
    durationMinutes: 180,
    platform: 'youtube',
    membersOnly: false,
    thumbnailUrl: 'https://i.ytimg.com/vi/S6PD4T8H4Cw/maxresdefault.jpg',
  },
  {
    id: 'thuriview',
    title: '#THUREVIEW vtuber fav',
    description: {
      en: 'Reviewing YOUR Favorite VTubers!',
      jp: 'みんなの推しV紹介！',
      id: 'Review VTuber Favorit Kamu!',
      kr: '시청자 최애 버튜버 리뷰!',
    },
    weekday: 4,
    time: '15:30',
    durationMinutes: 180,
    platform: 'youtube',
    membersOnly: false,
    thumbnailUrl: 'https://placehold.co/1080x720?text=Mizu+Live',
  },
];
