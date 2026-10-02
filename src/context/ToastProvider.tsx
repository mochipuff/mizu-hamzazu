import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ToastContext } from './toast.ts';
import styles from './ToastProvider.module.css';

interface ToastMessage {
  id: number;
  text: string;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const counter = useRef(0);

  const notify = useCallback((text: string) => {
    window.clearTimeout(timer.current);
    counter.current += 1;
    setToast({ id: counter.current, text });
    timer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext value={value}>
      {children}
      <div className={styles.region} role="status" aria-live="polite">
        {toast && (
          <p key={toast.id} className={styles.toast}>
            {toast.text}
          </p>
        )}
      </div>
    </ToastContext>
  );
}
