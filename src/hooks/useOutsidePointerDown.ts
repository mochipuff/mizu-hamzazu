import { useEffect, useRef, type RefObject } from 'react';

/** Calls `onOutside` when a press lands outside `ref`. Only listens while `active`. `onOutside` can be an inline function: the latest one is always called. */
export function useOutsidePointerDown(ref: RefObject<Element | null>, active: boolean, onOutside: () => void): void {
  const callback = useRef(onOutside);

  useEffect(() => {
    callback.current = onOutside;
  }, [onOutside]);

  useEffect(() => {
    if (!active) return undefined;
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !ref.current?.contains(event.target)) callback.current();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [ref, active]);
}
