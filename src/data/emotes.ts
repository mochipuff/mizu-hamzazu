export interface Emote {
  name: string;
  label: string;
  usage: string;
}

export const emotes = [
  { name: 'mizuShy', label: 'Shy', usage: 'Blushing and bashful moments' },
  { name: 'mizuHappyLove', label: 'Lovee', usage: 'Good vibes and good news' },
  { name: 'mizuHuh', label: 'Huh?', usage: 'Confusing' },
  { name: 'mizuLove', label: 'Love', usage: 'Love you?' },
  { name: 'mizuBuffer', label: 'Buffer', usage: 'Lag, loading and brain freezes' },
  { name: 'mizuAngry', label: 'Angry', usage: 'Boss fights and bad decisions' },
  { name: 'mizuHeadpat', label: 'Headpat', usage: 'Praise, comfort and pats for Mizu' },
  { name: 'mizuSmug', label: 'Smug', usage: 'When chat is right again' },
  { name: 'mizuSleepy', label: 'Sleepy', usage: 'Late-night chat energy' },
  { name: 'mizuHype', label: 'Hype', usage: 'Big moments and clutch plays' },
  { name: 'mizuGG', label: 'GG', usage: 'Wins, losses and good games' },
  { name: 'mizuUhh', label: 'Uhh', usage: 'Dahlah' },
] as const satisfies readonly Emote[];

export type EmoteName = (typeof emotes)[number]['name'];
