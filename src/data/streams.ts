import type { EmoteName } from './emotes.ts';
import type { Messages } from '../i18n/types.ts';

export interface StreamType {
  id: keyof Messages['about']['streamTypes'];
  emote: EmoteName;
}

export const streamTypes: StreamType[] = [
  { id: 'games', emote: 'mizuHappyLove' },
  { id: 'karaoke', emote: 'mizuHype' },
  { id: 'freetalk', emote: 'mizuLove' },
];
