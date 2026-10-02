import { forwardRef, useId, type ReactNode, type SVGProps } from 'react';
import { palette } from '../../lib/palette.ts';

export type EyeStyle = 'open' | 'happy' | 'heart' | 'star' | 'closed' | 'smug' | 'wide' | 'wink';
export type MouthStyle = 'smile' | 'open' | 'cat' | 'wavy' | 'small' | 'smirk' | 'tongue';
export type EmoteExtra = 'sparkles' | 'hearts' | 'tears' | 'zzz' | 'sweat' | 'blush';

export interface MizuFaceProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  eyes: EyeStyle;
  mouth: MouthStyle;
  extras?: readonly EmoteExtra[];
  background?: string | null;
  title?: string;
}

const { ink, coral, sun, fur, furDark, furLight, furBelly, ear, earInner, skin, skinShade, white } = palette;

const stroke = { stroke: ink, strokeWidth: 5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

function Eye({ style, x, mirrored = false }: { style: EyeStyle; x: number; mirrored?: boolean }): ReactNode {
  const y = 124;
  const flip = mirrored ? -1 : 1;

  switch (style) {
    case 'happy':
      return <path d={`M${x - 15} ${y + 6}Q${x} ${y - 14} ${x + 15} ${y + 6}`} fill="none" {...stroke} />;
    case 'closed':
      return <path d={`M${x - 15} ${y - 2}Q${x} ${y + 12} ${x + 15} ${y - 2}`} fill="none" {...stroke} />;
    case 'smug':
      return (
        <>
          <path d={`M${x - 16} ${y + 4}Q${x} ${y + 12} ${x + 16} ${y + 4}`} fill="none" {...stroke} />
          <path d={`M${x - 16 * flip} ${y - 8}L${x + 16 * flip} ${y - 14}`} fill="none" {...stroke} strokeWidth={4} />
        </>
      );
    case 'heart':
      return (
        <path
          d={`M${x} ${y + 16}C${x - 26} ${y - 2} ${x - 14} ${y - 20} ${x} ${y - 8}C${x + 14} ${y - 20} ${x + 26} ${y - 2} ${x} ${y + 16}Z`}
          fill={coral}
          {...stroke}
          strokeWidth={4}
        />
      );
    case 'star':
      return (
        <path
          d={`M${x} ${y - 18}l5.5 11.5 12.5 1.5-9.2 8.6 2.4 12.4L${x} ${y + 9.5}l-11.2 6.5 2.4-12.4L${x - 18} ${y - 5}l12.5-1.5z`}
          fill={sun}
          {...stroke}
          strokeWidth={3.5}
        />
      );
    case 'wide':
      return (
        <>
          <circle cx={x} cy={y} r={15} fill={white} {...stroke} strokeWidth={4} />
          <circle cx={x} cy={y} r={3.5} fill={ink} />
        </>
      );
    case 'wink':
      return mirrored ? (
        <path d={`M${x - 15} ${y + 4}Q${x} ${y - 12} ${x + 15} ${y + 4}`} fill="none" {...stroke} />
      ) : (
        <Eye style="open" x={x} />
      );
    case 'open':
    default:
      return (
        <>
          <ellipse cx={x} cy={y} rx={14} ry={17} fill={ink} />
          <ellipse cx={x} cy={y + 4} rx={9} ry={9} fill="#5c3a24" />
          <circle cx={x + 4} cy={y - 6} r={5} fill={white} />
          <circle cx={x - 5} cy={y + 8} r={2.5} fill={white} />
        </>
      );
  }
}

function Mouth({ style }: { style: MouthStyle }): ReactNode {
  switch (style) {
    case 'open':
      return (
        <>
          <path d="M84 148Q100 176 116 148Z" fill={ink} {...stroke} strokeWidth={4} />
          <path d="M92 162Q100 170 108 162Q100 158 92 162Z" fill={coral} />
        </>
      );
    case 'cat':
      return <path d="M82 148Q91 158 100 148Q109 158 118 148" fill="none" {...stroke} strokeWidth={4.5} />;
    case 'wavy':
      return <path d="M82 158Q88 148 94 158T106 158T118 158" fill="none" {...stroke} strokeWidth={4.5} />;
    case 'small':
      return <ellipse cx={100} cy={154} rx={6} ry={5} fill={ink} />;
    case 'smirk':
      return <path d="M86 152Q102 160 118 146" fill="none" {...stroke} strokeWidth={4.5} />;
    case 'tongue':
      return (
        <>
          <path d="M86 148Q100 160 114 148" fill="none" {...stroke} strokeWidth={4.5} />
          <path d="M97 154v10a5 5 0 0 0 10 0v-8" fill={coral} {...stroke} strokeWidth={3.5} />
        </>
      );
    case 'smile':
    default:
      return <path d="M84 148Q100 164 116 148" fill="none" {...stroke} strokeWidth={4.5} />;
  }
}

function Extra({ kind }: { kind: EmoteExtra }): ReactNode {
  switch (kind) {
    case 'blush':
      return (
        <g fill={coral} opacity={0.55}>
          <ellipse cx={58} cy={140} rx={12} ry={7} />
          <ellipse cx={142} cy={140} rx={12} ry={7} />
        </g>
      );
    case 'sparkles':
      return (
        <g fill={sun} stroke={ink} strokeWidth={2.5} strokeLinejoin="round">
          <path d="M28 44c1 7 4 10 11 11-7 1-10 4-11 11-1-7-4-10-11-11 7-1 10-4 11-11z" />
          <path d="M172 30c1 5 3 7 8 8-5 1-7 3-8 8-1-5-3-7-8-8 5-1 7-3 8-8z" />
        </g>
      );
    case 'hearts':
      return (
        <g fill={coral} stroke={ink} strokeWidth={2.5} strokeLinejoin="round">
          <path d="M30 60c-10-6-4-16 2-12 6-4 12 6 2 12z" transform="translate(-4 -4) scale(1.3)" />
          <path d="M168 44c-8-5-3-13 2-10 5-3 10 5 2 10z" transform="scale(1.2) translate(-24 -4)" />
        </g>
      );
    case 'tears':
      return (
        <g fill="#8fd8ff" stroke={ink} strokeWidth={2.5} strokeLinejoin="round">
          <path d="M60 140c-6 9-9 14-9 19a9 9 0 0 0 18 0c0-5-3-10-9-19z" />
          <path d="M140 140c-6 9-9 14-9 19a9 9 0 0 0 18 0c0-5-3-10-9-19z" />
        </g>
      );
    case 'sweat':
      return (
        <path
          d="M160 62c-7 11-10 16-10 21a10 10 0 0 0 20 0c0-5-3-10-10-21z"
          fill="#8fd8ff"
          stroke={ink}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
      );
    case 'zzz':
      return (
        <g fill="none" stroke={ink} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M150 52h16l-16 16h16" />
          <path d="M172 26h11l-11 11h11" strokeWidth={3.2} />
        </g>
      );
  }
}

export const MizuFace = forwardRef<SVGSVGElement, MizuFaceProps>(function MizuFace(
  { eyes, mouth, extras = [], background = null, title, ...rest },
  ref,
) {
  const uid = useId();
  const gradientId = `${uid}-fur`;
  const earGradientId = `${uid}-ear`;
  const titleId = `${uid}-title`;
  const cheekPuff = extras.includes('sparkles') || extras.includes('hearts') || mouth === 'open';

  return (
    <svg
      ref={ref}
      viewBox="0 0 200 200"
      role={title ? 'img' : undefined}
      aria-labelledby={title ? titleId : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...rest}
    >
      {title && <title id={titleId}>{title}</title>}
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={furLight} />
          <stop offset="0.55" stopColor={fur} />
          <stop offset="1" stopColor={furDark} />
        </linearGradient>
        <linearGradient id={earGradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={furLight} />
          <stop offset="1" stopColor={fur} />
        </linearGradient>
      </defs>

      {background && <rect width="200" height="200" fill={background} />}

      <ellipse cx={62} cy={46} rx={26} ry={24} fill={`url(#${earGradientId})`} {...stroke} strokeWidth={4.5} />
      <ellipse cx={62} cy={48} rx={14} ry={13} fill={earInner} />
      <ellipse cx={138} cy={46} rx={26} ry={24} fill={`url(#${earGradientId})`} {...stroke} strokeWidth={4.5} />
      <ellipse cx={138} cy={48} rx={14} ry={13} fill={earInner} />

      <path
        d="M100 24c-42 0-66 34-66 78 0 44 28 76 66 76s66-32 66-76c0-44-24-78-66-78z"
        fill={`url(#${gradientId})`}
        {...stroke}
        strokeWidth={4.5}
      />
      <path
        d="M100 40c-32 0-50 26-50 62 0 8 1 15 3 22 6-4 12-7 18-7 4-10 16-17 29-17s25 7 29 17c6 0 12 3 18 7 2-7 3-14 3-22 0-36-18-62-50-62z"
        fill={furBelly}
        opacity={0.9}
      />

      <ellipse
        cx={46}
        cy={128}
        rx={cheekPuff ? 25 : 20}
        ry={cheekPuff ? 22 : 17}
        fill={skin}
        {...stroke}
        strokeWidth={4}
      />
      <ellipse
        cx={154}
        cy={128}
        rx={cheekPuff ? 25 : 20}
        ry={cheekPuff ? 22 : 17}
        fill={skin}
        {...stroke}
        strokeWidth={4}
      />
      <ellipse cx={40} cy={132} rx={8} ry={6} fill={skinShade} opacity={0.6} />
      <ellipse cx={160} cy={132} rx={8} ry={6} fill={skinShade} opacity={0.6} />

      <ellipse cx={100} cy={150} rx={54} ry={44} fill={skin} {...stroke} strokeWidth={4.5} />
      <path d="M70 172c9 7 19 11 30 11s21-4 30-11c-5 9-16 16-30 16s-25-7-30-16z" fill={skinShade} opacity={0.5} />

      <ellipse cx={100} cy={137} rx={7} ry={5} fill={ear} />
      <circle cx={98} cy={135} r={1.6} fill={white} opacity={0.8} />
      <path
        d="M93 139c-9-1-19 1-26 5M93 143c-9 2-18 6-24 11"
        fill="none"
        stroke={ink}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.4}
      />
      <path
        d="M107 139c9-1 19 1 26 5M107 143c9 2 18 6 24 11"
        fill="none"
        stroke={ink}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.4}
      />

      <Eye style={eyes} x={74} />
      <Eye style={eyes} x={126} mirrored />
      <Mouth style={mouth} />
      {extras.map((extra) => (
        <Extra key={extra} kind={extra} />
      ))}
    </svg>
  );
});
