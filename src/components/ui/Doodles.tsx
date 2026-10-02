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

export function Squiggle({ color = '#daa047', ...rest }: DoodleProps) {
  return (
    <svg viewBox="0 0 160 16" aria-hidden="true" focusable="false" preserveAspectRatio="none" {...rest}>
      <path
        d="M3 9c8-8 14-8 22 0s14 8 22 0 14-8 22 0 14 8 22 0 14-8 22 0 14 8 22 0 14-8 22 0"
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Droplet({ color = '#daa047', outline = '#373332', ...rest }: DoodleProps) {
  return (
    <svg viewBox="0 0 32 40" aria-hidden="true" focusable="false" {...rest}>
      <path
        d="M16 3C11 12 4 18 4 26a12 12 0 0 0 24 0C28 18 21 12 16 3z"
        fill={color}
        stroke={outline}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M10 26a6 6 0 0 0 5 6" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
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
