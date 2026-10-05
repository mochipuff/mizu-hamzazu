/** The label and usage of each emote live in the messages (`emotes.items.<name>`). */
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
