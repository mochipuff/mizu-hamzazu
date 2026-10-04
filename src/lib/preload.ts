import { emotes } from '../data/emotes.ts';
import { heroImages } from '../data/hero.ts';
import { membershipTiers } from '../data/membership.ts';
import { streamSlots } from '../data/schedule.ts';
import { emotePng } from './assets.ts';

// Must match the @font-face families imported in main.tsx.
const FONTS = ['400 1em "Mochiy Pop One"', '500 1em "Zen Maru Gothic"', '700 1em "Zen Maru Gothic"'];

// Every image on the site comes from these lists, including the remote schedule thumbnails.
const IMAGES = [
  ...Object.values(heroImages),
  ...emotes.map(({ name }) => emotePng(name)),
  ...membershipTiers.map(({ badge }) => badge),
  ...streamSlots.flatMap(({ thumbnailUrl }) => thumbnailUrl ?? []),
];

// Safety net only: a request that never answers must not hold the page hostage forever.
const TIMEOUT_MS = 20_000;

// A broken file fires `error` instead of `load`; it counts as settled so one 404 cannot block the site.
const loadImage = (src: string): Promise<void> =>
  new Promise((resolve) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(), { once: true });
    image.addEventListener('error', () => resolve(), { once: true });
    image.src = src;
  });

const windowLoaded = (): Promise<void> =>
  new Promise((resolve) => {
    if (document.readyState === 'complete') return resolve();
    window.addEventListener('load', () => resolve(), { once: true });
  });

/** Resolves once the window, every web font and every image has fired its load event. */
export async function preloadAssets(onProgress: (done: number, total: number) => void): Promise<void> {
  const tasks = [windowLoaded(), ...FONTS.map((font) => document.fonts.load(font).then(() => undefined, () => undefined)), ...IMAGES.map(loadImage)];
  let done = 0;
  tasks.forEach((task) =>
    task.then(() => {
      done += 1;
      onProgress(done, tasks.length);
    }),
  );

  const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, TIMEOUT_MS));
  await Promise.race([Promise.all(tasks).then(() => document.fonts.ready), timeout]);
}

/** After the first render: wait until every <img> now in the DOM is loaded and decoded, so nothing pops in under the loader. */
export async function waitForDomImages(): Promise<void> {
  await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)));
}
