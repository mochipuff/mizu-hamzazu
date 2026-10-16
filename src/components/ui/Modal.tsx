import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react';
import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** The accessible name of the dialog. */
  label: string;
  /** Styles the panel (padding, width); the dialog itself only centres it. */
  className?: string;
  children: ReactNode;
}

/**
 * A modal on the browser's own `<dialog>`: it traps focus, closes on Esc, makes the rest of the page inert and gives focus back
 * to what opened it. The children are only rendered while it is open, so nothing inside loads before it is needed.
 */
export function Modal({ open, onClose, label, className, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  // The dialog has no padding of its own, so a click that lands on the dialog itself landed on the backdrop.
  const closeOnBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <dialog ref={ref} className={styles.dialog} aria-label={label} onClose={onClose} onClick={closeOnBackdrop}>
      {open && <div className={[styles.panel, className].filter(Boolean).join(' ')}>{children}</div>}
    </dialog>
  );
}
