import type { CSSProperties, ElementType, ReactNode } from 'react';
import { useInView } from '../../hooks/useInView.ts';
import styles from './Reveal.module.css';

interface RevealProps {
  as?: ElementType;
  variant?: 'pop' | 'drop' | 'swing';
  delay?: number;
  className?: string;
  children: ReactNode;
}

export function Reveal({ as: Tag = 'div', variant = 'pop', delay = 0, className, children }: RevealProps) {
  const [ref, inView] = useInView<HTMLElement>();
  return (
    <Tag
      ref={ref}
      className={[styles.reveal, className].filter(Boolean).join(' ')}
      data-variant={variant}
      data-in={inView}
      style={{ '--delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
