import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useGsap } from '../../hooks/useGsap.ts';
import { onSplash } from '../../lib/events.ts';
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

type SeedKind = 'ambient' | 'burst';

const STORM_MS = 4200;

// A small seeded generator (mulberry32), so a given seed always produces the same pattern.
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const between = (random: () => number, min: number, max: number): number => min + random() * (max - min);

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

// The seeded generator always returns the same seeds, so they are made once, not on every render.
const AMBIENT_SEEDS = createSeeds(16, 7, false);

/** One seed with its own fall. Ambient seeds loop forever; a burst seed falls once after its delay. */
function Seed({ seed, kind }: { seed: SeedSpec; kind: SeedKind }) {
  const ref = useRef<HTMLSpanElement>(null);

  useGsap(ref, () => {
    const isAmbient = kind === 'ambient';
    const fall = gsap.fromTo(
      ref.current,
      { x: 0, y: 0, rotation: 0 },
      { x: seed.drift, y: '105vh', rotation: seed.spin, duration: seed.duration, delay: isAmbient ? 0 : seed.delay, ease: 'none', repeat: isAmbient ? -1 : 0, repeatRefresh: true },
    );
    // Ambient seeds start part-way down their fall, so the page never opens on an empty sky.
    if (isAmbient) fall.progress((((-seed.delay % seed.duration) + seed.duration) % seed.duration) / seed.duration);
  });

  return <span ref={ref} className={styles.seed} data-kind={kind} style={{ '--left': `${seed.left}%`, '--size': `${seed.size}px`, '--delay': `${seed.delay}s` } as CSSProperties} />;
}

export function AmbientSeeds() {
  const [storm, setStorm] = useState(0);

  useEffect(() => onSplash(() => setStorm((count) => count + 1)), []);

  useEffect(() => {
    if (!storm) return undefined;
    const timer = window.setTimeout(() => setStorm(0), STORM_MS);
    return () => window.clearTimeout(timer);
  }, [storm]);

  // A new storm gets new seeds, and the storm count in the key restarts every seed's fall.
  const burst = useMemo(() => (storm ? createSeeds(40, storm * 97, true) : []), [storm]);

  return (
    <div className={styles.layer} aria-hidden="true">
      {AMBIENT_SEEDS.map((seed) => (
        <Seed key={seed.id} seed={seed} kind="ambient" />
      ))}
      {burst.map((seed) => (
        <Seed key={`${storm}-${seed.id}`} seed={seed} kind="burst" />
      ))}
    </div>
  );
}
