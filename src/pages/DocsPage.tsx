import { lazy, Suspense } from 'react';
import { useI18n } from '../i18n/i18n.ts';
import styles from './DocsPage.module.css';

const DocsReference = lazy(() => import('./DocsReference.tsx'));

/** The interactive API reference. Hidden from search engines (`HIDDEN_PAGES`), and not linked from the menus. */
export function DocsPage() {
  const { t } = useI18n();

  return (
    <main id="main" className={styles.page}>
      <h1 className={styles.heading}>{t.docs.title}</h1>
      <Suspense fallback={<p className={styles.status}>{t.docs.loading}</p>}>
        <DocsReference />
      </Suspense>
    </main>
  );
}
