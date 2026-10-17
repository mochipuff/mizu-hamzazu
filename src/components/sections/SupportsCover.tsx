import type { CSSProperties } from 'react';
import { supportLinks } from '../../data/supports.ts';
import { useI18n } from '../../i18n/i18n.ts';
import { ButtonLink } from '../ui/Button.tsx';
import { Paw, Sparkle } from '../ui/Doodles.tsx';
import { Paper } from '../ui/Paper.tsx';
import { Bow, Flower, Heart, Star } from '../ui/Stickers.tsx';
import styles from './SupportsCover.module.css';

export function SupportsCover() {
  const { t } = useI18n();
  const { cover } = t.supports;

  return (
    <section id="top" className={styles.cover} aria-labelledby="supports-title">
      <div className={`container ${styles.stage}`}>
        <p className={styles.ribbon}>
          <Bow className={styles.ribbonBow} />
          {cover.sticker}
        </p>
        <h1 id="supports-title" className={styles.title}>
          {cover.title}
        </h1>

        <Paper tone="butter" pattern="dots" torn tape tilt={-1.2} className={styles.lead}>
          <p>{cover.lead}</p>
        </Paper>

        <ul className={styles.ways} aria-label={cover.waysLabel}>
          {supportLinks.map(({ label, url }, index) => (
            <li key={url}>
              <ButtonLink href={url} variant={index === 0 ? 'primary' : 'secondary'} icon={index === 0 ? 'heart' : 'star'}>
                {label}
              </ButtonLink>
            </li>
          ))}
        </ul>

        {/* Loose stickers around the title. The last three only appear when there is room for them. */}
        <Heart className={`${styles.deco} ${styles.heart}`} style={{ '--delay': '0s' } as CSSProperties} />
        <Star className={`${styles.deco} ${styles.star}`} style={{ '--delay': '-1.2s' } as CSSProperties} />
        <Flower className={`${styles.deco} ${styles.flower}`} style={{ '--delay': '-2.4s' } as CSSProperties} />
        <Paw className={`${styles.deco} ${styles.paw}`} style={{ '--delay': '-0.7s' } as CSSProperties} />
        <Sparkle className={`${styles.deco} ${styles.sparkle}`} style={{ '--delay': '-1.8s' } as CSSProperties} />
      </div>
    </section>
  );
}
