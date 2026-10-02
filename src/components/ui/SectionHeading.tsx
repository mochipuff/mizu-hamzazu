import type { ReactNode } from 'react';
import { Sparkle, Squiggle } from './Doodles.tsx';
import styles from './SectionHeading.module.css';

interface SectionHeadingProps {
  headingId: string;
  title: string;
  children?: ReactNode;
  align?: 'center' | 'start';
}

export function SectionHeading({ headingId, title, children, align = 'center' }: SectionHeadingProps) {
  return (
    <header className={styles.head} data-align={align}>
      <div className={styles.titleWrap}>
        <Sparkle className={styles.sparkleLeft} color="var(--sun)" />
        <h2 id={headingId} className={styles.title}>
          {title}
        </h2>
        <Sparkle className={styles.sparkleRight} color="var(--rust)" />
      </div>
      <Squiggle className={styles.squiggle} />
      {children && <p className={styles.lead}>{children}</p>}
    </header>
  );
}
