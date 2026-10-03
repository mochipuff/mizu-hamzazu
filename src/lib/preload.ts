import { emotes } from '../data/emotes.ts';
import { heroImages } from '../data/hero.ts';
import { emotePng } from './assets.ts';

// Must match the @font-face families imported in main.tsx.
const FONTS = ['400 1em "Mochiy Pop One"', '500 1em "Zen Maru Gothic"', '700 1em "Zen Maru Gothic"'];

// Every image on the site comes from these two lists, so nothing else needs to be discovered.
const IMAGES = [...Object.values(heroImages), ...emotes.map(({ name }) => emotePng(name))];

const TIMEOUT_MS = 10_000;

function loadImage(src: string): Promise<void> {
  const image = new Image();
  image.src = src;
  return image.decode();
}

/**
 * Resolves once every font and image has loaded (or failed, or the timeout hit),
 * so a missing file or a slow network can never leave the loader stuck.
 */
export async function preloadAssets(onProgress: (done: number, total: number) => void): Promise<void> {
  const tasks: Promise<unknown>[] = [...FONTS.map((font) => document.fonts.load(font)), ...IMAGES.map(loadImage)];
  let done = 0;

  const settled = Promise.all(
    tasks.map((task) =>
      task
        .catch(() => undefined)
        .finally(() => {
          done += 1;
          onProgress(done, tasks.length);
        }),
    ),
  ).then(() => document.fonts.ready);

  let timer: number | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = window.setTimeout(resolve, TIMEOUT_MS);
  });

  await Promise.race([settled, timeout]);
  window.clearTimeout(timer);
}
