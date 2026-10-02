import { useEffect, useRef, useState, type RefObject } from 'react';

const isSupported = (): boolean => typeof IntersectionObserver !== 'undefined';

export function useInView<T extends Element>(threshold = 0.15): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(() => !isSupported());

  useEffect(() => {
    const node = ref.current;
    if (!node || inView) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -6% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [inView, threshold]);

  return [ref, inView];
}
