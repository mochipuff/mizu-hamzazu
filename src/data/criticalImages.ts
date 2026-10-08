import { emoteUrl } from '../lib/assets.ts';
import { heroDefaultMood, heroImages } from './hero.ts';

/** What the page shows on first paint: the loading screen waits for these and the build preloads them. Everything else loads lazily. */
export const criticalImages: readonly string[] = [...Object.values(heroImages), emoteUrl(heroDefaultMood)];
