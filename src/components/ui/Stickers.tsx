import type { SVGProps } from 'react';
import styles from './Stickers.module.css';

type StickerProps = SVGProps<SVGSVGElement> & { color?: string; outline?: string };

const INK = '#373332';

const stickerClass = (className?: string): string => [styles.sticker, className].filter(Boolean).join(' ');

const svgProps = { 'aria-hidden': true, focusable: false } as const;

export function Heart({ color = 'var(--pastel-pink)', outline = INK, className, ...rest }: StickerProps) {
  return (
    <svg viewBox="0 0 32 32" className={stickerClass(className)} {...svgProps} {...rest}>
      <path d="M16 28S4 20.5 4 11.5A6.5 6.5 0 0 1 16 8a6.5 6.5 0 0 1 12 3.5C28 20.5 16 28 16 28z" fill={color} stroke={outline} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M9 11.5c.4-1.6 1.6-2.6 3-2.8" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Star({ color = 'var(--pastel-butter)', outline = INK, className, ...rest }: StickerProps) {
  return (
    <svg viewBox="0 0 32 32" className={stickerClass(className)} {...svgProps} {...rest}>
      <path d="m16 3 3.9 8.1 8.9 1.2-6.5 6.2 1.6 8.8L16 23l-7.9 4.3 1.6-8.8-6.5-6.2 8.9-1.2z" fill={color} stroke={outline} strokeWidth="2.4" strokeLinejoin="round" />
    </svg>
  );
}

export function Bow({ color = 'var(--pastel-pink)', outline = INK, className, ...rest }: StickerProps) {
  return (
    <svg viewBox="0 0 48 32" className={stickerClass(className)} {...svgProps} {...rest}>
      <path d="M24 16C15 2 2 4 4 16c-2 12 11 14 20 0z" fill={color} stroke={outline} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M24 16c9-14 22-12 20 0 2 12-11 14-20 0z" fill={color} stroke={outline} strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="24" cy="16" r="4.4" fill="var(--sun)" stroke={outline} strokeWidth="2.2" />
    </svg>
  );
}

const PETAL_ANGLES = [0, 60, 120, 180, 240, 300] as const;

export function Flower({ color = 'var(--pastel-lilac)', outline = INK, className, ...rest }: StickerProps) {
  return (
    <svg viewBox="0 0 40 40" className={stickerClass(className)} {...svgProps} {...rest}>
      {PETAL_ANGLES.map((angle) => (
        <ellipse key={angle} cx="20" cy="10" rx="5.5" ry="8" transform={`rotate(${angle} 20 20)`} fill={color} stroke={outline} strokeWidth="2.2" />
      ))}
      <circle cx="20" cy="20" r="5" fill="var(--sun)" stroke={outline} strokeWidth="2.2" />
    </svg>
  );
}

export function Cloud({ color = 'var(--pastel-sky)', outline = INK, className, ...rest }: StickerProps) {
  return (
    <svg viewBox="0 0 48 32" className={stickerClass(className)} {...svgProps} {...rest}>
      <path d="M12 27a8 8 0 0 1-1-15.9A10 10 0 0 1 30 8a8.5 8.5 0 0 1 7.5 12.5A6.5 6.5 0 0 1 36 27z" fill={color} stroke={outline} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M14 14.5c1-1.8 2.6-2.8 4.6-3" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Pin({ color = 'var(--pastel-pink)', outline = INK, className, ...rest }: StickerProps) {
  return (
    <svg viewBox="0 0 32 32" className={stickerClass(className)} {...svgProps} {...rest}>
      <path d="m20 3 9 9-3.2.8-4.6 4.6.8 5.2-2.4 2.4-5-5L7 28l-3-3 8.4-8.6-5-5L9.8 9l5.2.8 4.6-4.6z" fill={color} stroke={outline} strokeWidth="2.4" strokeLinejoin="round" />
    </svg>
  );
}
