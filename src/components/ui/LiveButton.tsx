import type { ComponentProps } from 'react';
import { ButtonLink } from './Button.tsx';
import styles from './LiveButton.module.css';

type LiveButtonProps = Omit<ComponentProps<typeof ButtonLink>, 'variant' | 'icon'>;

/** The call to action while a stream is on: a beating dot, a ring that ripples out of the button and a sheen that sweeps across it. */
export function LiveButton({ children, className, ...rest }: LiveButtonProps) {
  return (
    <ButtonLink variant="primary" className={[styles.live, className].filter(Boolean).join(' ')} {...rest}>
      <span className={styles.label}>
        <span className={styles.dot} aria-hidden="true" />
        {children}
      </span>
    </ButtonLink>
  );
}
