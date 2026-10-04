import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useGsap } from '../../hooks/useGsap.ts';
import { onSplash } from '../../lib/events.ts';
import { between, createRandom } from '../../lib/math.ts';
import { gsap } from '../../lib/motion.ts';
import styles from './AmbientSeeds.module.css';

interface SeedSpec {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  spin: number;
}

function createSeeds(count: number, seed: number, burst: boolean): SeedSpec[] {
  const random = createRandom(seed);
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: between(random, 2, 96),
    size: between(random, burst ? 10 : 8, burst ? 22 : 16),
    duration: between(random, burst ? 1.6 : 10, burst ? 3.2 : 20),
    delay: burst ? between(random, 0, 0.8) : -between(random, 0, 20),
    drift: between(random, -70, 70),
    spin: between(random, -260, 260),
  }));
}

const STORM_MS = 4200;

type SeedKind = 'ambient' | 'burst';

const seedId = (kind: SeedKind, id: number): string => `${kind}-${id}`;

/** Drops each seed from above the viewport to below it while it spins and drifts sideways. */
function fall(layer: HTMLElement, seeds: SeedSpec[], kind: SeedKind): void {
  seeds.forEach((seed) => {
    const element = layer.querySelector(`[data-seed="${seedId(kind, seed.id)}"]`);
    if (!element) return;

    const tween = gsap.fromTo(
      element,
      { x: 0, y: 0, rotation: 0 },
      {
        x: seed.drift,
        y: '105vh',
        rotation: seed.spin,
        duration: seed.duration,
        delay: kind === 'burst' ? seed.delay : 0,
        ease: 'none',
        repeat: kind === 'ambient' ? -1 : 0,
        repeatRefresh: true,
      },
    );
    // Ambient seeds carry a negative delay so the page never starts with an empty sky.
    if (kind === 'ambient') tween.progress(((-seed.delay % seed.duration) + seed.duration) % seed.duration / seed.duration);
  });
}

export function AmbientSeeds() {
  const ambient = useMemo(() => createSeeds(16, 7, false), []);
  const [storm, setStorm] = useState(0);

  useEffect(() => onSplash(() => setStorm((count) => count + 1)), []);

  useEffect(() => {
    if (!storm) return undefined;
    const timer = window.setTimeout(() => setStorm(0), STORM_MS);
    return () => window.clearTimeout(timer);
  }, [storm]);

  const burst = useMemo(() => (storm ? createSeeds(40, storm * 97, true) : []), [storm]);
  const layerRef = useRef<HTMLDivElement>(null);

  useGsap(layerRef, () => fall(layerRef.current as HTMLElement, ambient, 'ambient'), [ambient]);
  useGsap(layerRef, () => fall(layerRef.current as HTMLElement, burst, 'burst'), [burst]);

  // --delay is only read by the reduced-motion fallback in the stylesheet, which parks ambient seeds in place.
  const render = (seed: SeedSpec, kind: SeedKind) => (
    <span
      key={`${kind}-${storm}-${seed.id}`}
      className={styles.seed}
      data-kind={kind}
      data-seed={seedId(kind, seed.id)}
      style={{ '--left': `${seed.left}%`, '--size': `${seed.size}px`, '--delay': `${seed.delay}s` } as CSSProperties}
    />
  );

  return (
    <div ref={layerRef} className={styles.layer} aria-hidden="true">
      {ambient.map((seed) => render(seed, 'ambient'))}
      {burst.map((seed) => render(seed, 'burst'))}
    </div>
  );
}
