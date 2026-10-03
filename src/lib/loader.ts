const loader = document.getElementById('loader');
const bar = loader?.querySelector('[role="progressbar"]');

const FADE_MS = 450;

export function updateLoader(done: number, total: number): void {
  const progress = total === 0 ? 1 : done / total;
  loader?.style.setProperty('--progress', progress.toFixed(3));
  bar?.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
}

export async function hideLoader(): Promise<void> {
  if (!loader) return;

  updateLoader(1, 1);
  loader.inert = true;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fade = loader.animate({ opacity: [1, 0] }, { duration: reduceMotion ? 0 : FADE_MS, easing: 'ease' });

  await fade.finished;
  loader.remove();
}
