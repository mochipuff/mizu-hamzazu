import { useRef } from 'react';
import { useGsap } from '../../hooks/useGsap.ts';
import { gsap, IDLE, POP, ScrollTrigger } from '../../lib/motion.ts';
import { Sparkle } from './Doodles.tsx';
import styles from './StreamDecor.module.css';

const CENTER = '60 60';
const SPARKLES = [
  { x: 14, y: 22, size: 14 },
  { x: 100, y: 14, size: 12 },
  { x: 96, y: 96, size: 10 },
] as const;

/**
 * A little broadcast TV in the corner of the schedule.
 * Idle: it bobs, its antennas wiggle, signal rings pulse and sparkles twinkle.
 * Scroll: it drifts and tilts as the section passes, wobbles with scroll speed, and pops in the first time it is seen.
 * Each layer owns different properties, so the animations never fight over a transform.
 */
export function StreamDecor() {
  const ref = useRef<HTMLDivElement>(null);

  useGsap(ref, () => {
    const root = ref.current;
    const section = root?.closest('section');
    if (!root || !section) return;

    gsap.set('[data-layer]', { svgOrigin: CENTER });

    // Scroll: entrance, parallax drift and a speed-driven wobble.
    gsap.from('[data-layer="pop"]', {
      scale: 0,
      rotation: -50,
      duration: 0.9,
      ease: POP,
      scrollTrigger: { trigger: section, start: 'top 85%', once: true },
    });

    gsap.fromTo(
      root,
      { y: -12, rotation: -8 },
      { y: 80, rotation: 12, ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 0.6 } },
    );

    const wobble = gsap.quickTo('[data-layer="wobble"]', 'rotation', { duration: 0.7, ease: 'elastic.out(1, 0.35)' });
    const settle = gsap.delayedCall(0.12, () => wobble(0)).pause();
    ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        wobble(gsap.utils.clamp(-16, 16, self.getVelocity() / -220));
        settle.restart(true);
      },
    });

    // Idle: bob, wiggle, pulse, twinkle.
    gsap.to('[data-layer="float"]', { y: -6, rotation: 2.5, duration: 2.4, ease: IDLE, yoyo: true, repeat: -1 });

    gsap.utils.toArray<SVGElement>('[data-antenna]').forEach((antenna, index) => {
      gsap.set(antenna, { svgOrigin: index === 0 ? '52 46' : '68 46' });
      gsap.fromTo(antenna, { rotation: -7 }, { rotation: 7, duration: 1.1 + index * 0.3, ease: IDLE, yoyo: true, repeat: -1 });
    });

    gsap.set('[data-play]', { svgOrigin: '56 65' });
    gsap.to('[data-play]', { scale: 1.18, duration: 0.7, ease: IDLE, yoyo: true, repeat: -1 });

    gsap.utils.toArray<SVGElement>('[data-ring]').forEach((ring, index) => {
      gsap.fromTo(ring, { scale: 0.7, opacity: 0.8 }, { scale: 2, opacity: 0, duration: 2.4, delay: index * 0.8, ease: 'power1.out', repeat: -1 });
    });

    gsap.utils.toArray<SVGElement>('[data-sparkle]').forEach((sparkle, index) => {
      const { x, y, size } = SPARKLES[index] ?? SPARKLES[0];
      gsap.set(sparkle, { svgOrigin: `${x + size / 2} ${y + size / 2}` });
      gsap.fromTo(sparkle, { scale: 0.3, opacity: 0.3 }, { scale: 1.1, opacity: 1, rotation: 40, duration: 1.2, delay: index * 0.5, ease: IDLE, yoyo: true, repeat: -1 });
    });
  });

  return (
    <div ref={ref} className={styles.decor} aria-hidden="true">
      <svg viewBox="0 0 120 120" className={styles.art} focusable="false">
        {[0, 1, 2].map((ring) => (
          <circle key={ring} data-ring cx="60" cy="60" r="30" fill="none" stroke="var(--sun)" strokeWidth="3" vectorEffect="non-scaling-stroke" opacity="0" />
        ))}

        <g data-layer="pop">
          <g data-layer="wobble">
            <g data-layer="float">
              <g data-antenna>
                <line x1="52" y1="46" x2="40" y2="28" stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" />
                <circle cx="40" cy="28" r="3.6" fill="var(--drop)" stroke="var(--ink)" strokeWidth="2.5" />
              </g>
              <g data-antenna>
                <line x1="68" y1="46" x2="82" y2="26" stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" />
                <circle cx="82" cy="26" r="3.6" fill="var(--drop)" stroke="var(--ink)" strokeWidth="2.5" />
              </g>

              <rect x="32" y="46" width="56" height="38" rx="11" fill="var(--white)" stroke="var(--ink)" strokeWidth="3.5" />
              <rect x="38" y="52" width="34" height="26" rx="7" fill="var(--sun-soft)" stroke="var(--ink)" strokeWidth="2.5" />
              <polygon data-play points="51,57 51,73 64,65" fill="var(--drop)" stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round" />
              <circle cx="80" cy="60" r="2.8" fill="var(--ink)" />
              <circle cx="80" cy="71" r="2.8" fill="var(--ink)" />
              <line x1="42" y1="86" x2="40" y2="92" stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="78" y1="86" x2="80" y2="92" stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" />
            </g>
          </g>
        </g>

        {SPARKLES.map(({ x, y, size }) => (
          <g key={`${x}-${y}`} data-sparkle>
            <Sparkle x={x} y={y} width={size} height={size} color="var(--sun)" />
          </g>
        ))}
      </svg>
    </div>
  );
}
