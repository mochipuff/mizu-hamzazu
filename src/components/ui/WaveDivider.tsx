import { useRef } from 'react';
import { useGsap } from '../../hooks/useGsap.ts';
import { gsap } from '../../lib/motion.ts';
import styles from './WaveDivider.module.css';

const PATH = 'M0 34 Q150 4 300 34 T600 34 T900 34 T1200 34 T1500 34 T1800 34 T2100 34 T2400 34 V80 H0 Z';

export function WaveDivider({ color }: { color: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useGsap(ref, () => {
    gsap.to(`.${styles.front}`, { xPercent: -50, duration: 16, ease: 'none', repeat: -1 });
    gsap.fromTo(`.${styles.back}`, { xPercent: -50 }, { xPercent: 0, duration: 24, ease: 'none', repeat: -1 });
  });

  return (
    <div ref={ref} className={styles.wave} aria-hidden="true">
      <svg className={styles.back} viewBox="0 0 2400 80" preserveAspectRatio="none">
        <path d={PATH} fill={color} opacity="0.5" />
      </svg>
      <svg className={styles.front} viewBox="0 0 2400 80" preserveAspectRatio="none">
        <path d={PATH} fill={color} />
      </svg>
    </div>
  );
}
