import type { CSSProperties, ElementType, ReactNode } from 'react';
import styles from './Panel.module.css';

export type PanelTone = 'white' | 'sun' | 'lilac' | 'mint' | 'pink' | 'ink';
export type PanelShape = 'soft' | 'leaf' | 'ticket';

interface PanelProps {
  as?: ElementType;
  tone?: PanelTone;
  shape?: PanelShape;
  tilt?: number;
  tape?: boolean;
  className?: string;
  children: ReactNode;
  id?: string;
}

export function Panel({ as: Tag = 'div', tone = 'white', shape = 'soft', tilt = 0, tape = false, className, children, ...rest }: PanelProps) {
  return (
    <Tag
      className={[styles.panel, tape ? styles.tape : '', className].filter(Boolean).join(' ')}
      data-tone={tone}
      data-shape={shape}
      style={{ '--tilt': `${tilt}deg` } as CSSProperties}
      {...rest}
    >
      {children}
    </Tag>
  );
}
