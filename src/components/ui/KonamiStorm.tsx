import { useSound } from '../../context/sound.ts';
import { useToast } from '../../context/toast.ts';
import { useKonami } from '../../hooks/useKonami.ts';
import { triggerSplash } from '../../lib/events.ts';

/** Secret-code easter egg: renders nothing, triggers the falling-seed storm. */
export function KonamiStorm() {
  const toast = useToast();
  const sound = useSound();

  useKonami(() => {
    triggerSplash();
    sound.play('sparkle');
    toast.notify('Secret code found! Confetti storm unlocked.');
  });

  return null;
}
