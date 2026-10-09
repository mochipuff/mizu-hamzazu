import type { CSSProperties, ReactNode } from 'react';
import styles from './Paper.module.css';

export type PaperTone = 'cream' | 'pink' | 'butter' | 'mint' | 'sky' | 'lilac';
export type PaperPattern = 'plain' | 'ruled' | 'dots' | 'gingham';

interface PaperProps {
  tone?: PaperTone;
  pattern?: PaperPattern;
  /** Rips the bottom edge. */
  torn?: boolean;
  /** A strip of washi tape across the top. */
  tape?: boolean;
  tilt?: number;
  className?: string;
  children: ReactNode;
}

/** A sheet of scrapbook paper with an ink outline that follows its torn edge. */
export function Paper({ tone = 'cream', pattern = 'plain', torn = false, tape = false, tilt = 0, className, children }: PaperProps) {
  return (
    <div className={[styles.paper, className].filter(Boolean).join(' ')} style={{ '--tilt': `${tilt}deg` } as CSSProperties}>
      {tape && <span className={styles.tape} aria-hidden="true" />}
      <div className={styles.outline}>
        <div className={styles.sheet} data-tone={tone} data-pattern={pattern} data-torn={torn}>
          {children}
        </div>
      </div>
    </div>
  );
}
