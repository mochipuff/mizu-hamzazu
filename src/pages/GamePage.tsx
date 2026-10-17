import { Notice } from '../components/ui/Notice.tsx';
import { SectionHeading } from '../components/ui/SectionHeading.tsx';
import { WaveDivider } from '../components/ui/WaveDivider.tsx';
import { useI18n } from '../i18n/i18n.ts';
import styles from './GamePage.module.css';

/** The home of the Bonding card (the header's quick menu links here). It only says it is on its way until the game itself exists. */
export function GamePage() {
  const { t } = useI18n();
  const { game } = t;

  return (
    <>
      <main id="main">
        <section className={styles.section} aria-labelledby="game-title">
          <div className="container">
            <SectionHeading headingId="game-title" title={game.title} as="h1">
              {game.lead}
            </SectionHeading>
            <Notice kind="empty">{t.header.comingSoon}</Notice>
          </div>
        </section>
      </main>
      <WaveDivider color="var(--ink)" />
    </>
  );
}
