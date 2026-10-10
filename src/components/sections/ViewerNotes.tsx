import type { CSSProperties } from 'react';
import { useApi } from '../../data/api.ts';
import { supportLinks, type ViewerNote } from '../../data/supports.ts';
import { useI18n } from '../../i18n/i18n.ts';
import { ButtonLink } from '../ui/Button.tsx';
import { Paper } from '../ui/Paper.tsx';
import { Reveal } from '../ui/Reveal.tsx';
import { SectionHeading } from '../ui/SectionHeading.tsx';
import { Heart } from '../ui/Stickers.tsx';
import styles from './ViewerNotes.module.css';

// Notes cycle through these, so neighbours never look alike and a new note needs no styling of its own.
const TONES = ['butter', 'pink', 'mint', 'sky', 'lilac'] as const;
const SHAPES = ['sticky', 'card', 'scrap'] as const;
const TILTS = [-2.2, 1.4, -0.8, 2, -1.5, 0.9] as const;

export function ViewerNotes() {
  const { t } = useI18n();
  const { notes } = t.supports;
  const invite = supportLinks[0];
  const { status, data: viewerNotes = [] } = useApi<ViewerNote[]>('/api/notes/');

  return (
    <section id="notes" className={styles.section} aria-labelledby="notes-title">
      <div className="container">
        <SectionHeading headingId="notes-title" title={notes.title}>
          {notes.lead}
        </SectionHeading>

        <ul className={styles.wall} aria-label={notes.listLabel}>
          {viewerNotes.map(({ id, name, text }, index) => (
            <li key={id} className={styles.slot}>
              <Reveal variant="pop" delay={Math.min(index, 3) * 70}>
                <figure
                  className={styles.note}
                  data-tone={TONES[index % TONES.length]}
                  data-shape={SHAPES[index % SHAPES.length]}
                  style={{ '--tilt': `${TILTS[index % TILTS.length]}deg` } as CSSProperties}
                >
                  <blockquote className={styles.text}>
                    <p>{text}</p>
                  </blockquote>
                  <figcaption className={styles.from}>{notes.from(name)}</figcaption>
                  <Heart className={styles.heart} />
                </figure>
              </Reveal>
            </li>
          ))}

          {invite && (
            <li className={styles.slot}>
              <Paper tone="pink" pattern="dots" torn tape tilt={1.2} className={styles.invite}>
                <h3 className={styles.inviteTitle}>{notes.inviteTitle}</h3>
                <p className={styles.inviteLead}>{notes.inviteLead}</p>
                <ButtonLink href={invite.url} icon="heart">
                  {notes.inviteCta}
                </ButtonLink>
              </Paper>
            </li>
          )}
        </ul>
        {status === 'error' && (
          <p className="load-error" role="alert">
            {t.common.loadFailed}
          </p>
        )}
      </div>
    </section>
  );
}
