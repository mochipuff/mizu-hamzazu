import { useRef, useState } from 'react';
import { Sparkle, Star } from 'lucide-react';
import { useGsap } from '../../hooks/useGsap.ts';
import { gsap, IDLE, POP } from '../../lib/motion.ts';
import styles from './StarField.module.css';

const STAR_COUNT = 16;
const SHAPES = [Star, Sparkle] as const;
const COLORS = ['var(--sun)', 'var(--pastel-pink)', 'var(--pastel-butter)', 'var(--pastel-sky)', 'var(--pastel-mint)'] as const;

const between = (min: number, max: number): number => min + Math.random() * (max - min);

interface StarSpec {
  id: number;
  Shape: (typeof SHAPES)[number];
  color: (typeof COLORS)[number];
  size: number;
  left: number;
  top: number;
}

const createStars = (): StarSpec[] =>
  Array.from({ length: STAR_COUNT }, (_, id) => ({
    id,
    Shape: SHAPES[id % SHAPES.length] ?? Star,
    color: COLORS[id % COLORS.length] ?? COLORS[0],
    size: Math.round(between(18, 42)),
    left: between(2, 95),
    top: between(3, 93),
  }));

export function StarField() {
  const ref = useRef<HTMLDivElement>(null);
  const [stars] = useState(createStars);

  useGsap(ref, () => {
    gsap.utils.toArray<HTMLElement>('[data-star]').forEach((star, index) => {
      const body = star.firstElementChild;
      const relocate = () => gsap.set(star, { left: `${between(2, 95)}%`, top: `${between(3, 93)}%` });

      relocate();
      gsap
        .timeline({ delay: index * 0.35 + between(0, 1.5), repeat: -1, repeatDelay: between(0.4, 3), onRepeat: relocate })
        .fromTo(body, { scale: 0, rotation: -70, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.7, ease: POP })
        .to(body, { scale: 1.2, rotation: 14, duration: between(0.6, 1), ease: IDLE, yoyo: true, repeat: 3 })
        .to(body, { scale: 0, rotation: 60, opacity: 0, duration: 0.5, ease: 'back.in(1.7)' });
    });
  });

  return (
    <div ref={ref} className={styles.field} aria-hidden="true">
      {stars.map(({ id, Shape, color, size, left, top }) => (
        <span key={id} className={styles.star} data-star style={{ left: `${left}%`, top: `${top}%`, width: size, height: size }}>
          <span className={styles.body}>
            <Shape size={size} fill={color} stroke="var(--ink)" strokeWidth={2.4} />
          </span>
        </span>
      ))}
    </div>
  );
}
