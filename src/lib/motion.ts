import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** The springy overshoot used for everything that pops in. */
export const POP = 'back.out(1.7)';
/** Slow, symmetric easing for idle loops. */
export const IDLE = 'sine.inOut';

export const MOTION_OK = '(prefers-reduced-motion: no-preference)';

export const prefersReducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export { gsap, ScrollTrigger };
