import { useRef, useState, type ComponentType, type SVGProps } from 'react';
import { useGsap } from '../../hooks/useGsap.ts';
import { gsap, IDLE, POP } from '../../lib/motion.ts';
import styles from './PopField.module.css';

type Shape = ComponentType<SVGProps<SVGSVGElement>>;

const PALETTE = ['var(--sun)', 'var(--pastel-pink)', 'var(--pastel-butter)', 'var(--pastel-sky)', 'var(--pastel-mint)'] as const;

const between = (min: number, max: number): number => min + Math.random() * (max - min);

interface PopSpec {
  id: number;
  size: number;
  left: number;
  top: number;
}

const createSpecs = (count: number): PopSpec[] =>
  Array.from({ length: count }, (_, id) => ({ id, size: Math.round(between(18, 42)), left: between(2, 95), top: between(3, 93) }));

interface PopFieldProps {
  /** Drawn in turn, so a field of two shapes alternates between them. */
  shapes: readonly Shape[];
  colors?: readonly string[];
  count?: number;
  /** Scatters inside the nearest positioned ancestor (a section) instead of across the whole viewport. */
  contained?: boolean;
}

/** Shapes that pop in at a random spot, wobble, shrink away and come back somewhere else. Behind the content, never in the way of the pointer. */
export function PopField({ shapes, colors = PALETTE, count = 16, contained = false }: PopFieldProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [specs] = useState(() => createSpecs(count));

  useGsap(ref, () => {
    gsap.utils.toArray<HTMLElement>('[data-pop]').forEach((item, index) => {
      const body = item.firstElementChild;
      const relocate = () => gsap.set(item, { left: `${between(2, 95)}%`, top: `${between(3, 93)}%` });

      relocate();
      gsap
        .timeline({ delay: index * 0.35 + between(0, 1.5), repeat: -1, repeatDelay: between(0.4, 3), onRepeat: relocate })
        .fromTo(body, { scale: 0, rotation: -70, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.7, ease: POP })
        .to(body, { scale: 1.2, rotation: 14, duration: between(0.6, 1), ease: IDLE, yoyo: true, repeat: 3 })
        .to(body, { scale: 0, rotation: 60, opacity: 0, duration: 0.5, ease: 'back.in(1.7)' });
    });
  });

  return (
    <div ref={ref} className={styles.field} data-contained={contained} aria-hidden="true">
      {specs.map(({ id, size, left, top }) => {
        const Shape = shapes[id % shapes.length];
        const color = colors[id % colors.length];
        return Shape ? (
          <span key={id} className={styles.item} data-pop style={{ left: `${left}%`, top: `${top}%`, width: size, height: size }}>
            <span className={styles.body}>
              <Shape width={size} height={size} color={color} />
            </span>
          </span>
        ) : null;
      })}
    </div>
  );
}
