import styles from './WaveDivider.module.css';

interface WaveDividerProps {
  color: string;
  flip?: boolean;
}

export function WaveDivider({ color, flip = false }: WaveDividerProps) {
  const path = 'M0 34 Q150 4 300 34 T600 34 T900 34 T1200 34 T1500 34 T1800 34 T2100 34 T2400 34 V80 H0 Z';

  return (
    <div className={styles.wave} data-flip={flip} aria-hidden="true">
      <svg className={styles.back} viewBox="0 0 2400 80" preserveAspectRatio="none">
        <path d={path} fill={color} opacity="0.5" />
      </svg>
      <svg className={styles.front} viewBox="0 0 2400 80" preserveAspectRatio="none">
        <path d={path} fill={color} />
      </svg>
    </div>
  );
}
