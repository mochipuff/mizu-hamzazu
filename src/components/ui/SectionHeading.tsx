import { useRef, type ReactNode } from 'react';
import { useGsap } from '../../hooks/useGsap.ts';
import { gsap, IDLE } from '../../lib/motion.ts';
import { Branch, Clover, Sparkle } from './Doodles.tsx';
import styles from './SectionHeading.module.css';

interface SectionHeadingProps {
  headingId: string;
  title: string;
  children?: ReactNode;
}

export function SectionHeading({ headingId, title, children }: SectionHeadingProps) {
  const ref = useRef<HTMLElement>(null);

  useGsap(ref, () => {
    const twinkle = { scale: 1.15, rotation: 20, opacity: 1, duration: 1.3, ease: IDLE, yoyo: true, repeat: -1 };
    gsap.fromTo(`.${styles.sparkleLeft}`, { scale: 0.85, rotation: 0, opacity: 0.8 }, twinkle);
    gsap.fromTo(`.${styles.sparkleRight}`, { scale: 0.85, rotation: 0, opacity: 0.8 }, { ...twinkle, delay: 1.3 });
  });

  return (
    <header ref={ref} className={styles.head}>
      <div className={styles.titleWrap}>
        <Sparkle className={styles.sparkleLeft} color="var(--sun)" />
        <h2 id={headingId} className={styles.title}>
          {title}
        </h2>
        <Sparkle className={styles.sparkleRight} color="var(--rust)" />
      </div>
      <div className={styles.ornament} aria-hidden="true">
        <Branch className={styles.branchLeft} />
        <Clover className={styles.clover} />
        <Branch className={styles.branchRight} />
      </div>
      {children && <p className={styles.lead}>{children}</p>}
    </header>
  );
}
