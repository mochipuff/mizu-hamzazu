import { useState, type ImgHTMLAttributes } from 'react';
import { Paw } from './Doodles.tsx';
import styles from './LoadingImage.module.css';

/** The animated stand-in for an image that is still downloading: moving stripes and a paw that hops. When the image failed it stays, still and faded. */
export function ImagePlaceholder({ failed = false }: { failed?: boolean }) {
  return (
    <span className={styles.placeholder} data-failed={failed} aria-hidden="true">
      <Paw className={styles.paw} color="var(--drop)" />
    </span>
  );
}

/** Two bars in the shape of a title and a date, pulsing while the text of a card is on its way. */
export function SkeletonLines() {
  return (
    <span className={styles.lines} aria-hidden="true">
      <span className={styles.bar} />
      <span className={styles.bar} />
    </span>
  );
}

type LoadingImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'onLoad' | 'onError'> & {
  src: string;
  alt: string;
};

/**
 * An image in a frame that shows the placeholder until the file has arrived, then fades and settles the image in.
 * The frame has no size of its own: give it one (an aspect ratio, a border) with `className`.
 */
export function LoadingImage({ className, ...image }: LoadingImageProps) {
  // The result remembers which `src` it is for, so a frame that gets a new image starts loading again.
  const [result, setResult] = useState<{ src: string; state: 'ready' | 'error' } | null>(null);
  const state = result?.src === image.src ? result.state : 'loading';

  const handleLoad = () => setResult({ src: image.src, state: 'ready' });
  const handleError = () => setResult({ src: image.src, state: 'error' });

  return (
    <span className={[styles.frame, className].filter(Boolean).join(' ')} data-state={state}>
      <img {...image} className={styles.image} onLoad={handleLoad} onError={handleError} />
      <ImagePlaceholder failed={state === 'error'} />
    </span>
  );
}
