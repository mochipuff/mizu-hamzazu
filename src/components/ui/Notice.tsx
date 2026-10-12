import type { ReactNode } from 'react';
import { Paw } from './Doodles.tsx';
import styles from './Notice.module.css';

/** What a list shows when its data could not be loaded (`error`) or when there is nothing in it yet (`empty`). */
export function Notice({ kind, children }: { kind: 'error' | 'empty'; children: ReactNode }) {
  return (
    <div className={styles.notice} data-kind={kind} role={kind === 'error' ? 'alert' : 'status'}>
      <Paw className={styles.icon} color={kind === 'error' ? 'var(--rust)' : 'var(--lagoon)'} />
      <p>{children}</p>
    </div>
  );
}
