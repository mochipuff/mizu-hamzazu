import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Latin only on purpose: the Japanese subsets are 1 to 1.5 MB each (or hundreds of CSS rules when sliced), so kana, kanji and Hangul use the system fonts listed in --font-cjk-fallback.
import '@fontsource/mochiy-pop-one/latin-400.css';
import '@fontsource/zen-maru-gothic/latin-500.css';
import '@fontsource/zen-maru-gothic/latin-700.css';
// The handwriting of the supports page. Only downloaded once a page uses it.
import '@fontsource/gaegu/latin-400.css';
import '@fontsource/gaegu/latin-700.css';
import './styles/global.css';
import { App } from './App.tsx';
import { criticalImages } from './data/images.ts';
import { ensureLocaleInUrl } from './i18n/navigation.ts';
import { gsap, prefersReducedMotion } from './lib/motion.ts';

const FONTS = ['400 1em "Mochiy Pop One"', '500 1em "Zen Maru Gothic"', '700 1em "Zen Maru Gothic"'];
const PRELOAD_TIMEOUT_MS = 4_000;
const FADE_SECONDS = 0.45;

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root was not found.');

ensureLocaleInUrl();

// React mounts right away behind the loading screen; the screen only decides when it is revealed.
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

const loader = document.getElementById('loader');

if (loader) {
  const setProgress = (progress: number): void => {
    loader.style.setProperty('--progress', progress.toFixed(3));
    loader.querySelector('[role="progressbar"]')?.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
  };

  // A file that fails to load must not hold the loading screen, so a failure counts as done.
  const loadFont = (font: string): Promise<void> => document.fonts.load(font).then(() => undefined, () => undefined);

  // Resolves once the image is downloaded and decoded, so it paints the moment the loading screen fades instead of popping in after it.
  const loadImage = async (src: string): Promise<void> => {
    const image = new Image();
    image.src = src;
    await image.decode().catch(() => undefined);
  };

  const tasks = [...FONTS.map(loadFont), ...criticalImages.map(loadImage)];
  let done = 0;
  tasks.forEach((task) => void task.then(() => setProgress(++done / tasks.length)));

  let timer: number | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = window.setTimeout(resolve, PRELOAD_TIMEOUT_MS);
  });
  await Promise.race([Promise.all(tasks), timeout]);
  window.clearTimeout(timer);

  setProgress(1);
  loader.inert = true;
  await new Promise<void>((resolve) => {
    gsap.to(loader, { opacity: 0, duration: prefersReducedMotion() ? 0 : FADE_SECONDS, ease: 'sine.inOut', onComplete: resolve });
  });
  loader.remove();
}
