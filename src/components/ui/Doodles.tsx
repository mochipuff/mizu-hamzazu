import type { SVGProps } from 'react';

type DoodleProps = SVGProps<SVGSVGElement> & { color?: string; outline?: string };

export function Sparkle({ color = '#f0b863', outline = '#373332', ...rest }: DoodleProps) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false" {...rest}>
      <path
        d="M20 2c1.5 10 6.5 15.5 18 18-11.5 2.5-16.5 8-18 18C18.5 28 13.5 22.5 2 20 13.5 17.5 18.5 12 20 2z"
        fill={color}
        stroke={outline}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Paw({ color = '#daa047', outline = '#373332', ...rest }: DoodleProps) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" {...rest}>
      <ellipse cx="16" cy="21" rx="9" ry="7.5" fill={color} stroke={outline} strokeWidth="2.4" strokeLinejoin="round" />
      <ellipse cx="6.5" cy="12.5" rx="4" ry="5" fill={color} stroke={outline} strokeWidth="2.2" strokeLinejoin="round" />
      <ellipse cx="14.5" cy="7" rx="4" ry="5" fill={color} stroke={outline} strokeWidth="2.2" strokeLinejoin="round" />
      <ellipse cx="23.5" cy="9.5" rx="4" ry="5" fill={color} stroke={outline} strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  );
}

export function Starfish({ color = '#daa047', outline = '#373332', ...rest }: DoodleProps) {
  return (
    <svg viewBox="0 0 60 60" aria-hidden="true" focusable="false" {...rest}>
      <path
        d="M30 4l6.5 16.5 17.5 1.5-13.5 11.5 4.5 17.5L30 40.5 15 51l4.5-17.5L6 22l17.5-1.5z"
        fill={color}
        stroke={outline}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="30" cy="30" r="2.5" fill={outline} />
      <circle cx="23" cy="24" r="1.6" fill={outline} />
      <circle cx="37" cy="24" r="1.6" fill={outline} />
    </svg>
  );
}

const LEAVES = [
  [18, 27, -35],
  [18, 28, 35],
  [44, 23, -40],
  [44, 24, 30],
  [72, 18, -45],
  [72, 19, 25],
  [98, 13, -50],
  [98, 14, 20],
] as const;

/** A twig with paired leaves, growing up and to the right. Mirror it with CSS for the other side. */
export function Branch({ color = 'var(--leaf)', outline = '#373332', ...rest }: DoodleProps) {
  return (
    <svg viewBox="0 0 120 40" aria-hidden="true" focusable="false" {...rest}>
      <path d="M2 31C30 29 62 21 116 10" fill="none" stroke={outline} strokeWidth="3" strokeLinecap="round" />
      {LEAVES.map(([x, y, angle]) => (
        <path
          key={`${x}-${angle}`}
          d="M0 0c4-7 13-7 17 0-4 7-13 7-17 0z"
          transform={`translate(${x} ${y}) rotate(${angle})`}
          fill={color}
          stroke={outline}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

const CLOVER_ROTATIONS = [0, 90, 180, 270] as const;

/** A four-leaf clover. */
export function Clover({ color = 'var(--leaf)', outline = '#373332', ...rest }: DoodleProps) {
  return (
    <svg viewBox="0 0 40 44" aria-hidden="true" focusable="false" {...rest}>
      <path d="M20 21q2 9-3 20" fill="none" stroke={outline} strokeWidth="2.5" strokeLinecap="round" />
      {CLOVER_ROTATIONS.map((angle) => (
        <path
          key={angle}
          d="M20 20c-7-1-12-5-10-10 2-4 8-3 10 2 2-5 8-6 10-2 2 5-3 9-10 10z"
          transform={`rotate(${angle} 20 20)`}
          fill={color}
          stroke={outline}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
