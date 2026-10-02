import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? initialValue : (JSON.parse(raw) as T);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage is unavailable or full; the value simply won't persist */
    }
  }, [key, value]);

  const update = useCallback<Dispatch<SetStateAction<T>>>((next) => setValue(next), []);
  return [value, update];
}
