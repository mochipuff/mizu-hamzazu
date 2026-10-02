import { useEffect, useRef } from 'react';

const SEQUENCE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

export function useKonami(onMatch: () => void): void {
  const callback = useRef(onMatch);

  useEffect(() => {
    callback.current = onMatch;
  }, [onMatch]);

  useEffect(() => {
    let position = 0;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && TYPING_TAGS.has(event.target.tagName)) return;

      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (key === SEQUENCE[position]) position += 1;
      else position = key === SEQUENCE[0] ? 1 : 0;

      if (position === SEQUENCE.length) {
        position = 0;
        callback.current();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
