import type { EmoteName } from './emotes.ts';
import { heroUrl } from '../lib/assets.ts';

export const heroIntro =
  'Mizu Hamzazu is an isekai hamster who arrived with one primary mission: to find her lost younger sibling. Eternally 18 years old, Mizu is turning a new page in her journey.';

export const heroImages = {
  stand: heroUrl('stand'),
  wheel: heroUrl('wheel'),
  stage: heroUrl('stage'),
} as const;

export const heroDefaultMood: EmoteName = 'mizuSleepy';

export const heroReactions: readonly EmoteName[] = ['mizuSmug', 'mizuHype', 'mizuHeadpat'];

export const welcomeLine = 'Halo, zutopians!';

export const pokeLines: string[] = [
  'Ini placeholder 1',
  'Ini placeholder 2',
];

export const pokeMilestones: Record<number, string> = {
  10: 'Udah stop?',
  25: 'Sakit weh',
  50: 'Uhhhhhhhh pusing...',
};
