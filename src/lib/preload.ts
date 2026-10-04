import { heroDefaultMood, heroImages } from '../data/hero.ts';
import { emoteUrl } from './assets.ts';

// Must match the @font-face families imported in main.tsx.
const FONTS = ['400 1em "Mochiy Pop One"', '500 1em "Zen Maru Gothic"', '700 1em "Zen Maru Gothic"'];

// Only what is visible on first paint. Everything below the fold loads lazily.
const IMAGES = [...Object.values(heroImages), emoteUrl(heroDefaultMood)];

// Safety net only: a request that never answers must not hold the page hostage.
const TIMEOUT_MS = 4_000;

// A broken file fires `error` instead of `load`; it counts as settled so one 404 cannot block the site.
const loadImage = (src: string): Promise<void> =>
  new Promise((resolve) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(), { once: true });
    image.addEventListener('error', () => resolve(), { once: true });
    image.src = src;
  });

/** Resolves once the web fonts (so text never reflows) and the above-the-fold images are ready. */
export async function preloadCritical(onProgress: (done: number, total: number) => void): Promise<void> {
  const tasks = [...FONTS.map((font) => document.fonts.load(font).then(() => undefined, () => undefined)), ...IMAGES.map(loadImage)];
  let done = 0;
  tasks.forEach((task) =>
    task.then(() => {
      done += 1;
      onProgress(done, tasks.length);
    }),
  );

  const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, TIMEOUT_MS));
  await Promise.race([Promise.all(tasks), timeout]);
}
