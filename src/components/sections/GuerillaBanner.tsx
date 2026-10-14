import { useI18n } from '../../i18n/i18n.ts';
import styles from './GuerillaBanner.module.css';

/** Replaces the week while guerilla mode is on: a CRT that glitches in red. Reduced motion keeps the same colours, still. */
export function GuerillaBanner({ notice }: { notice: string }) {
  const { t } = useI18n();
  const { guerilla } = t.schedule;

  return (
    <section className={styles.banner} role="status" aria-labelledby="guerilla-title">
      <p className={styles.badge}>
        <span className={styles.pulse} aria-hidden="true" />
        {guerilla.badge}
      </p>
      <h3 id="guerilla-title" className={styles.title} data-text={guerilla.title}>
        {guerilla.title}
      </h3>
      <p className={styles.message}>{guerilla.message}</p>
      {notice && <p className={styles.notice}>{notice}</p>}
      <span className={styles.scanlines} aria-hidden="true" />
    </section>
  );
}
