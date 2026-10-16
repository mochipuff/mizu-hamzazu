import { useLayoutEffect, type DependencyList, type RefObject } from 'react';
import { gsap, MOTION_OK } from '../lib/motion.ts';

type Setup = () => void | (() => void);

export function useGsap(scope: RefObject<Element | null>, setup: Setup, deps: DependencyList = []): void {
  useLayoutEffect(() => {
    const mm = gsap.matchMedia(scope.current ?? undefined);
    mm.add(MOTION_OK, setup);
    return () => mm.revert();
  }, deps);
}
