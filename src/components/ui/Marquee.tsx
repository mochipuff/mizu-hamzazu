import { useRef, type CSSProperties } from 'react';
import { useGsap } from '../../hooks/useGsap.ts';
import { gsap } from '../../lib/motion.ts';
import { Sparkle } from './Doodles.tsx';
import styles from './Marquee.module.css';

interface MarqueeProps {
  items: readonly string[];
  tone?: 'ink' | 'sun';
  tilt?: number;
  duration?: number;
}

export function Marquee({ items, tone = 'ink', tilt = 0, duration = 32 }: MarqueeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const repeated = [...items, ...items];

  useGsap(
    rootRef,
    () => {
      const root = rootRef.current;
      // The track holds two identical groups, so sliding by half of it loops seamlessly.
      const slide = gsap.to(trackRef.current, { xPercent: -50, duration, ease: 'none', repeat: -1 });
      const setSpeed = (timeScale: number) => () => void gsap.to(slide, { timeScale, duration: 0.4, overwrite: true });
      const slow = setSpeed(0);
      const resume = setSpeed(1);

      root?.addEventListener('pointerenter', slow);
      root?.addEventListener('pointerleave', resume);
      return () => {
        root?.removeEventListener('pointerenter', slow);
        root?.removeEventListener('pointerleave', resume);
      };
    },
    [duration],
  );

  return (
    <div ref={rootRef} className={styles.marquee} data-tone={tone} aria-hidden="true">
      <div className={styles.rotate} style={{ '--tilt': `${tilt}deg` } as CSSProperties}>
        <div ref={trackRef} className={styles.track}>
          {[0, 1].map((copy) => (
            <ul key={copy} className={styles.group}>
              {repeated.map((item, index) => (
                <li key={`${item}-${index}`} className={styles.item}>
                  <span>{item}</span>
                  <Sparkle className={styles.icon} color={tone === 'sun' ? 'var(--rust)' : 'var(--sun)'} outline="transparent" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
