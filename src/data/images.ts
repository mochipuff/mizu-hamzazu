export const emoteNames = [
  'mizuShy',
  'mizuHappyLove',
  'mizuHuh',
  'mizuLove',
  'mizuBuffer',
  'mizuAngry',
  'mizuHeadpat',
  'mizuSmug',
  'mizuSleepy',
  'mizuHype',
  'mizuGG',
  'mizuUhh',
] as const;

export type EmoteName = (typeof emoteNames)[number];

export const emoteUrl = (name: EmoteName): string => `/emotes/${name}.webp`;

export const heroImages = {
  stand: '/hero/stand.webp',
  wheel: '/hero/wheel.webp',
  stage: '/hero/stage.webp',
} as const;

export const heroDefaultMood: EmoteName = 'mizuSleepy';

export const heroReactions: readonly EmoteName[] = ['mizuSmug', 'mizuHype', 'mizuHeadpat'];

export const criticalImages: readonly string[] = [...Object.values(heroImages), emoteUrl(heroDefaultMood)];
