import type { CSSProperties, ReactNode } from 'react';
import { Garland, type GarlandCorner } from './Garland.tsx';
import styles from './Panel.module.css';

export type PanelTone = 'white' | 'sun' | 'lilac' | 'mint' | 'pink';
type PanelShape = 'soft' | 'leaf' | 'ticket';

interface PanelProps {
  tone?: PanelTone;
  shape?: PanelShape;
  tilt?: number;
  tape?: boolean;
  garland?: GarlandCorner;
  className?: string;
  children: ReactNode;
}

export function Panel({ tone = 'white', shape = 'soft', tilt = 0, tape = false, garland, className, children }: PanelProps) {
  return (
    <div
      className={[styles.panel, tape && styles.tape, className].filter(Boolean).join(' ')}
      data-tone={tone}
      data-shape={shape}
      style={{ '--tilt': `${tilt}deg` } as CSSProperties}
    >
      {garland && <Garland corner={garland} />}
      {children}
    </div>
  );
}
