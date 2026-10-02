import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'play'
  | 'chat'
  | 'post'
  | 'discord'
  | 'copy'
  | 'check'
  | 'calendar'
  | 'download'
  | 'menu'
  | 'close'
  | 'sound-on'
  | 'sound-off'
  | 'mail'
  | 'heart'
  | 'star'
  | 'drop'
  | 'arrow-up'
  | 'external'
  | 'plus'
  | 'send'
  | 'clock'
  | 'lock';

const glyphs: Record<IconName, ReactNode> = {
  play: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="4" />
      <path d="M10 9.5 15 12l-5 2.5z" fill="currentColor" />
    </>
  ),
  chat: (
    <>
      <path d="M4 4h16v11h-5l-3 3-3-3H4z" />
      <path d="M9 8v3M14 8v3" />
    </>
  ),
  post: <path d="M5 5l14 14M19 5 5 19" />,
  discord: (
    <>
      <path d="M5 8c2-1.5 4-2 7-2s5 .5 7 2c1.2 3 1.8 6 1.5 9-1.5 1.2-3 1.8-4.5 2l-1-2c-1 .3-2 .4-3 .4s-2-.1-3-.4l-1 2c-1.5-.2-3-.8-4.5-2C3.2 14 3.8 11 5 8z" />
      <circle cx="9" cy="12.5" r="1.2" fill="currentColor" />
      <circle cx="15" cy="12.5" r="1.2" fill="currentColor" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="3" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="3" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </>
  ),
  download: <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  'sound-on': (
    <>
      <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" />
    </>
  ),
  'sound-off': (
    <>
      <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" />
      <path d="m16 9.5 5 5M21 9.5l-5 5" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  star: <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z" />,
  drop: <path d="M12 3.5C9 8 6 11 6 14.5a6 6 0 0 0 12 0C18 11 15 8 12 3.5z" />,
  'arrow-up': <path d="M12 19V6M6.5 11.5 12 6l5.5 5.5" />,
  external: <path d="M14 5h5v5M19 5l-8 8M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />,
  plus: <path d="M12 5v14M5 12h14" />,
  send: (
    <>
      <path d="M20 4 4 11l6 2.5 2.5 6.5z" />
      <path d="m10 13.5 10-9.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="3" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {glyphs[name]}
    </svg>
  );
}
