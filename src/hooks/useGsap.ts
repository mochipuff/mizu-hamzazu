import { useLayoutEffect, type DependencyList, type RefObject } from 'react';
import { gsap, MOTION_OK } from '../lib/motion.ts';

type Setup = () => void | (() => void);

/**
 * Runs `setup` inside a scoped GSAP context, only while the visitor has not asked for reduced motion.
 * Selector strings used inside `setup` only match elements inside `scope`, and everything the setup creates
 * (tweens, ScrollTriggers) is reverted on cleanup. With reduced motion nothing runs, so CSS must already
 * describe the final, static look.
 */
export function useGsap(scope: RefObject<Element | null>, setup: Setup, deps: DependencyList = []): void {
  useLayoutEffect(() => {
    const mm = gsap.matchMedia(scope.current ?? undefined);
    mm.add(MOTION_OK, setup);
    return () => mm.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the caller owns the dependency list.
  }, deps);
}
