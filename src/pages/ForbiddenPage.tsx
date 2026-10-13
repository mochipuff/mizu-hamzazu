import type { CSSProperties } from 'react';
import { ButtonLink } from '../components/ui/Button.tsx';
import { Paw, Sparkle } from '../components/ui/Doodles.tsx';
import { Icon } from '../components/ui/Icon.tsx';
import { Paper } from '../components/ui/Paper.tsx';
import { Heart, Star } from '../components/ui/Stickers.tsx';
import { WaveDivider } from '../components/ui/WaveDivider.tsx';
import { useI18n } from '../i18n/i18n.ts';
import { pagePath } from '../i18n/pages.ts';
import styles from './ForbiddenPage.module.css';

/** Where the API sends a visitor who opens one of its addresses in the browser. The page carries no data; it only says the address is closed. */
export function ForbiddenPage() {
  const { t, locale } = useI18n();
  const { forbidden } = t;

  return (
    <>
      <main id="main">
        <section className={styles.section} aria-labelledby="forbidden-title">
          <div className={`container ${styles.stage}`}>
            <p className={styles.ribbon}>
              <Icon name="lock" size={22} className={styles.lock} />
              {forbidden.sticker}
            </p>
            <h1 id="forbidden-title" className={styles.title}>
              {forbidden.title}
            </h1>

            <Paper tone="butter" pattern="dots" torn tape tilt={-1.2} className={styles.lead}>
              <p>{forbidden.lead}</p>
            </Paper>

            <ButtonLink href={pagePath(locale, 'home')} icon="home" size="lg">
              {forbidden.homeCta}
            </ButtonLink>

            <Star className={`${styles.deco} ${styles.star}`} style={{ '--delay': '0s' } as CSSProperties} />
            <Heart className={`${styles.deco} ${styles.heart}`} style={{ '--delay': '-1.4s' } as CSSProperties} />
            <Paw className={`${styles.deco} ${styles.paw}`} style={{ '--delay': '-0.7s' } as CSSProperties} />
            <Sparkle className={`${styles.deco} ${styles.sparkle}`} style={{ '--delay': '-2.1s' } as CSSProperties} />
          </div>
        </section>
      </main>
      <WaveDivider color="var(--ink)" />
    </>
  );
}
