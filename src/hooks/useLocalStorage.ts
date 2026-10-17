import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

/**
 * State that survives a reload. `isValid` checks what was stored: anything of another shape (an edited or an old value)
 * is ignored and `initialValue` is used instead. Nothing is written until the value has actually been changed.
 */
export function useLocalStorage<T>(key: string, initialValue: T, isValid: (value: unknown) => value is T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      const stored: unknown = raw === null ? undefined : JSON.parse(raw);
      return isValid(stored) ? stored : initialValue;
    } catch {
      return initialValue;
    }
  });
  const changed = useRef(false);

  useEffect(() => {
    if (!changed.current) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage is unavailable or full; the value simply won't persist */
    }
  }, [key, value]);

  // Stable between renders, so a context value built from it does not change on every render.
  const update = useCallback<Dispatch<SetStateAction<T>>>((next) => {
    changed.current = true;
    setValue(next);
  }, []);

  return [value, update];
}
