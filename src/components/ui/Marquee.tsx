import { Sparkle } from './Doodles.tsx';
import styles from './Marquee.module.css';

interface MarqueeProps {
  items: readonly string[];
  tone?: 'ink' | 'sun' | 'coral';
  tilt?: number;
  reverse?: boolean;
  duration?: number;
}

export function Marquee({ items, tone = 'ink', tilt = 0, reverse = false, duration = 32 }: MarqueeProps) {
  const repeated = [...items, ...items];

  return (
    <div className={styles.marquee} data-tone={tone} aria-hidden="true">
      <div
        className={styles.rotate}
        data-reverse={reverse}
        style={{ '--tilt': `${tilt}deg`, '--duration': `${duration}s` } as React.CSSProperties}
      >
        <div className={styles.track}>
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
