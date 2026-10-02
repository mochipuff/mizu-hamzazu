import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { onSplash } from '../../lib/events.ts';
import { between, createRandom } from '../../lib/math.ts';
import styles from './AmbientBubbles.module.css';

interface BubbleSpec {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
}

function createBubbles(count: number, seed: number, burst: boolean): BubbleSpec[] {
  const random = createRandom(seed);
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: between(random, 2, 96),
    size: between(random, burst ? 18 : 14, burst ? 74 : 56),
    duration: between(random, burst ? 2.6 : 16, burst ? 5 : 30),
    delay: burst ? between(random, 0, 0.9) : -between(random, 0, 30),
    drift: between(random, -60, 60),
  }));
}

const STORM_MS = 5600;

export function AmbientBubbles() {
  const ambient = useMemo(() => createBubbles(16, 7, false), []);
  const [storm, setStorm] = useState(0);

  useEffect(() => onSplash(() => setStorm((count) => count + 1)), []);

  useEffect(() => {
    if (!storm) return undefined;
    const timer = window.setTimeout(() => setStorm(0), STORM_MS);
    return () => window.clearTimeout(timer);
  }, [storm]);

  const burst = useMemo(() => (storm ? createBubbles(46, storm * 97, true) : []), [storm]);

  const render = (bubble: BubbleSpec, kind: 'ambient' | 'burst') => (
    <span
      key={`${kind}-${storm}-${bubble.id}`}
      className={styles.bubble}
      data-kind={kind}
      style={
        {
          '--left': `${bubble.left}%`,
          '--size': `${bubble.size}px`,
          '--duration': `${bubble.duration}s`,
          '--delay': `${bubble.delay}s`,
          '--drift': `${bubble.drift}px`,
        } as CSSProperties
      }
    />
  );

  return (
    <div className={styles.layer} aria-hidden="true">
      {ambient.map((bubble) => render(bubble, 'ambient'))}
      {burst.map((bubble) => render(bubble, 'burst'))}
    </div>
  );
}
