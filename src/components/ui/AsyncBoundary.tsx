import { Component, Suspense, type ReactNode } from 'react';
import { forgetFailures } from '../../data/api.ts';
import { useI18n } from '../../i18n/i18n.ts';
import { Button } from './Button.tsx';
import { Notice } from './Notice.tsx';
import styles from './AsyncBoundary.module.css';

/** What a list shows when it could not be loaded: the notice, and a button that asks again. */
export function LoadFailure({ retry }: { retry: () => void }) {
  const { t } = useI18n();

  return (
    <>
      <Notice kind="error">{t.common.loadFailed}</Notice>
      <div className={styles.retry}>
        <Button variant="secondary" size="sm" onClick={retry}>
          {t.common.retry}
        </Button>
      </div>
    </>
  );
}

interface FailureBoundaryProps {
  /** Changing it clears a failure, for content that switches (the tabs of a page). */
  resetKey?: unknown;
  failure: (retry: () => void) => ReactNode;
  children: ReactNode;
}

// React has no hook for catching a render error, so this is the one class component of the site.
class FailureBoundary extends Component<FailureBoundaryProps, { failed: boolean; resetKey: unknown }> {
  state = { failed: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  // A new `resetKey` clears the failure before the next render, so the children never render against a stale error.
  static getDerivedStateFromProps({ resetKey }: FailureBoundaryProps, state: { resetKey: unknown }) {
    return resetKey === state.resetKey ? null : { failed: false, resetKey };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  retry = () => {
    forgetFailures();
    this.setState({ failed: false });
  };

  render() {
    return this.state.failed ? this.props.failure(this.retry) : this.props.children;
  }
}

interface AsyncBoundaryProps {
  /** Shown while the data of the children (read with `useData`) is on its way. */
  fallback: ReactNode;
  /** Shown when it could not be loaded. Defaults to the notice with a "Try again" button. */
  failure?: (retry: () => void) => ReactNode;
  resetKey?: unknown;
  children: ReactNode;
}

/** Loading state, failure state and retry for everything below it that reads data with `useData`. */
export function AsyncBoundary({ fallback, failure = (retry) => <LoadFailure retry={retry} />, resetKey, children }: AsyncBoundaryProps) {
  return (
    <FailureBoundary resetKey={resetKey} failure={failure}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </FailureBoundary>
  );
}
