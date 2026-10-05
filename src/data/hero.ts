import type { EmoteName } from './emotes.ts';
import { heroUrl } from '../lib/assets.ts';

export const heroImages = {
  stand: heroUrl('stand'),
  wheel: heroUrl('wheel'),
  stage: heroUrl('stage'),
} as const;

export const heroDefaultMood: EmoteName = 'mizuSleepy';

export const heroReactions: readonly EmoteName[] = ['mizuSmug', 'mizuHype', 'mizuHeadpat'];
