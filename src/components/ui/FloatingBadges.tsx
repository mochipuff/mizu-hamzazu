import { useRef, type CSSProperties, type SyntheticEvent } from 'react';
import type { MembershipTier } from '../../data/membership.ts';
import { useGsap } from '../../hooks/useGsap.ts';
import { gsap, IDLE } from '../../lib/motion.ts';
import { Sparkle } from './Doodles.tsx';
import styles from './FloatingBadges.module.css';

const SPARKLES = [
  { top: '-8%', left: '8%', size: '1rem' },
  { top: '-4%', left: '92%', size: '0.75rem' },
  { top: '50%', left: '-6%', size: '0.7rem' },
  { top: '52%', left: '104%', size: '0.9rem' },
  { top: '104%', left: '30%', size: '0.8rem' },
  { top: '100%', left: '78%', size: '1rem' },
] as const;

// A missing badge file hides that slot instead of leaving a broken image icon.
const handleImageError = (event: SyntheticEvent<HTMLImageElement>) => {
  event.currentTarget.parentElement?.setAttribute('hidden', '');
};

/** Square tier badges that pop in on scroll, then hover and sparkle behind the card's content. */
export function FloatingBadges({ tiers }: { tiers: readonly MembershipTier[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useGsap(ref, () => {
    const slots = gsap.utils.toArray<HTMLElement>(`.${styles.slot}`);
    const badges = gsap.utils.toArray<HTMLElement>(`.${styles.badge}`);
    const sparkles = gsap.utils.toArray<SVGElement>(`.${styles.sparkle}`);

    // Scroll: each badge spins in the first time the card comes into view.
    gsap.from(slots, {
      scale: 0,
      rotation: -120,
      opacity: 0,
      duration: 0.8,
      ease: 'back.out(2)',
      stagger: 0.12,
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: ref.current, start: 'top 90%', once: true },
    });

    // Idle: every badge bobs on its own beat so they never move in lockstep.
    badges.forEach((badge, index) => {
      gsap.to(badge, {
        y: -(5 + (index % 3) * 2),
        rotation: index % 2 === 0 ? -6 : 6,
        duration: 2.2 + (index % 3) * 0.45,
        delay: index * 0.2,
        ease: IDLE,
        yoyo: true,
        repeat: -1,
      });
    });

    sparkles.forEach((sparkle, index) => {
      gsap.fromTo(
        sparkle,
        { scale: 0.2, opacity: 0, rotation: 0 },
        { scale: 1, opacity: 1, rotation: 45, duration: 1.2, delay: index * 0.45, ease: IDLE, yoyo: true, repeat: -1, repeatDelay: 0.5 },
      );
    });
  });

  return (
    <div ref={ref} className={styles.cluster} role="img" aria-label={`Membership badges: ${tiers.map((tier) => tier.name).join(', ')}`}>
      {tiers.map((tier) => (
        <span key={tier.id} className={styles.slot}>
          <img className={styles.badge} src={tier.badge} alt="" width={256} height={256} decoding="async" draggable={false} onError={handleImageError} />
        </span>
      ))}
      {SPARKLES.map(({ top, left, size }) => (
        <Sparkle key={`${top}-${left}`} className={styles.sparkle} style={{ top, left, '--s': size } as CSSProperties} color="var(--sun)" />
      ))}
    </div>
  );
}
