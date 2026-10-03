import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useGsap } from '../hooks/useGsap.ts';
import { gsap, POP } from '../lib/motion.ts';
import { ToastContext } from './toast.ts';
import styles from './ToastProvider.module.css';

interface ToastMessage {
  id: number;
  text: string;
}

function Toast({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useGsap(ref, () => void gsap.from(ref.current, { opacity: 0, y: 24, scale: 0.8, rotation: -3, duration: 0.42, ease: POP, clearProps: 'transform,opacity' }));

  return (
    <p ref={ref} className={styles.toast}>
      {text}
    </p>
  );
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
        {toast && <Toast key={toast.id} text={toast.text} />}
      </div>
    </ToastContext>
  );
}
