import type { EmoteName } from './emotes.ts';

export interface StreamType {
  title: string;
  description: string;
  emote: EmoteName;
}

export const streamTypes: StreamType[] = [
  {
    title: 'Games',
    description: 'Cozy game, puzzle, story?.',
    emote: 'mizuHappyLove',
  },
  {
    title: 'Karaoke',
    description: 'Nyanyiin lagu yang bisa dinyanyiin.',
    emote: 'mizuHype',
  },
  {
    title: 'Freetalk',
    description: 'Ngobrol apapun dengan topik random.',
    emote: 'mizuLove',
  },
];
