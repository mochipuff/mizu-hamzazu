import { useRef, type ReactNode } from 'react';
import { useGsap } from '../../hooks/useGsap.ts';
import { gsap, POP } from '../../lib/motion.ts';

type RevealVariant = 'pop' | 'drop' | 'swing';

interface RevealProps {
  variant?: RevealVariant;
  delay?: number;
  className?: string;
  children: ReactNode;
}

const FROM: Record<RevealVariant, gsap.TweenVars> = {
  pop: { scale: 0.8, rotation: -2.5 },
  drop: { y: -40, scaleY: 1.15, scaleX: 0.9 },
  swing: { transformPerspective: 700, rotationY: -28, x: -24 },
};

/** Plays its entrance once, the first time it scrolls into view. */
export function Reveal({ variant = 'pop', delay = 0, className, children }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGsap(
    ref,
    () => {
      gsap.from(ref.current, {
        ...FROM[variant],
        opacity: 0,
        duration: 0.75,
        delay: delay / 1000,
        ease: POP,
        clearProps: 'transform,opacity',
        scrollTrigger: { trigger: ref.current, start: 'top 94%', once: true },
      });
    },
    [variant, delay],
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
