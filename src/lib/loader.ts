import { gsap, prefersReducedMotion } from './motion.ts';

const loader = document.getElementById('loader');
const bar = loader?.querySelector('[role="progressbar"]');

const FADE_SECONDS = 0.45;

export function updateLoader(done: number, total: number): void {
  const progress = total === 0 ? 1 : done / total;
  loader?.style.setProperty('--progress', progress.toFixed(3));
  bar?.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
}

export async function hideLoader(): Promise<void> {
  if (!loader) return;

  updateLoader(1, 1);
  loader.inert = true;
  await new Promise<void>((resolve) => {
    gsap.to(loader, { opacity: 0, duration: prefersReducedMotion() ? 0 : FADE_SECONDS, ease: 'sine.inOut', onComplete: resolve });
  });
  loader.remove();
}
