import { Branch, Clover } from './Doodles.tsx';
import styles from './Garland.module.css';

export type GarlandCorner = 'top-left' | 'top-right';

interface GarlandProps {
  corner?: GarlandCorner;
}

/** A twig with a clover that hangs over a top corner of a positioned parent. Purely decorative. */
export function Garland({ corner = 'top-right' }: GarlandProps) {
  return (
    <span className={styles.garland} data-corner={corner} aria-hidden="true">
      <Branch className={styles.branch} />
      <Clover className={styles.clover} />
    </span>
  );
}
