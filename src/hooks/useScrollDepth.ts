import { useEffect } from 'react';
import { clamp } from '../lib/math.ts';

export function useScrollDepth(maxMeters: number): void {
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;

    const update = () => {
      frame = 0;
      const scrollable = root.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? clamp(window.scrollY / scrollable, 0, 1) : 0;
      root.style.setProperty('--depth', progress.toFixed(4));
      root.style.setProperty('--meters', String(Math.round(progress * maxMeters)));
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(document.body);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      resizeObserver.disconnect();
    };
  }, [maxMeters]);
}
