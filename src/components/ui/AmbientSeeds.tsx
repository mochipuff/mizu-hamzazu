import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { onSplash } from '../../lib/events.ts';
import { between, createRandom } from '../../lib/math.ts';
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

  const render = (seed: SeedSpec, kind: 'ambient' | 'burst') => (
    <span
      key={`${kind}-${storm}-${seed.id}`}
      className={styles.seed}
      data-kind={kind}
      style={
        {
          '--left': `${seed.left}%`,
          '--size': `${seed.size}px`,
          '--duration': `${seed.duration}s`,
          '--delay': `${seed.delay}s`,
          '--drift': `${seed.drift}px`,
          '--spin': `${seed.spin}deg`,
        } as CSSProperties
      }
    />
  );

  return (
    <div className={styles.layer} aria-hidden="true">
      {ambient.map((seed) => render(seed, 'ambient'))}
      {burst.map((seed) => render(seed, 'burst'))}
    </div>
  );
}
