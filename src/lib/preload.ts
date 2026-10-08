import { criticalImages } from '../data/criticalImages.ts';

const FONTS = ['400 1em "Mochiy Pop One"', '500 1em "Zen Maru Gothic"', '700 1em "Zen Maru Gothic"'];

const TIMEOUT_MS = 4_000;

// A file that fails to load must not hold the loading screen, so a failure counts as done.
const loadFont = (font: string): Promise<void> => document.fonts.load(font).then(() => undefined, () => undefined);

/** Resolves once the image is downloaded and decoded, so it paints the moment the loading screen fades instead of popping in after it. */
const loadImage = async (src: string): Promise<void> => {
  const image = new Image();
  image.src = src;
  await image.decode().catch(() => undefined);
};

export async function preloadCritical(onProgress: (done: number, total: number) => void): Promise<void> {
  const tasks = [...FONTS.map(loadFont), ...criticalImages.map(loadImage)];
  let done = 0;
  tasks.forEach((task) =>
    task.then(() => {
      done += 1;
      onProgress(done, tasks.length);
    }),
  );

  let timer: number | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = window.setTimeout(resolve, TIMEOUT_MS);
  });
  await Promise.race([Promise.all(tasks), timeout]);
  window.clearTimeout(timer);
}
