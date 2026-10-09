import { useEffect, useRef } from 'react';
import { useSound } from '../../context/sound.ts';
import { useToast } from '../../context/toast.ts';
import { useI18n } from '../../i18n/i18n.ts';
import { triggerSplash } from '../../lib/events.ts';

const SEQUENCE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/** Secret-code easter egg: renders nothing, triggers the falling-seed storm. */
export function KonamiStorm() {
  const toast = useToast();
  const sound = useSound();
  const { t } = useI18n();

  const onMatch = useRef(() => {});
  useEffect(() => {
    onMatch.current = () => {
      triggerSplash();
      sound.play('sparkle');
      toast.notify(t.common.secretCode);
    };
  }, [sound, toast, t]);

  useEffect(() => {
    let position = 0;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && TYPING_TAGS.has(event.target.tagName)) return;

      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (key === SEQUENCE[position]) position += 1;
      else position = key === SEQUENCE[0] ? 1 : 0;

      if (position === SEQUENCE.length) {
        position = 0;
        onMatch.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return null;
}
