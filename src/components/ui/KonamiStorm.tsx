import { useSound } from '../../context/sound.ts';
import { useToast } from '../../context/toast.ts';
import { useKonami } from '../../hooks/useKonami.ts';
import { useI18n } from '../../i18n/i18n.ts';
import { triggerSplash } from '../../lib/events.ts';

/** Secret-code easter egg: renders nothing, triggers the falling-seed storm. */
export function KonamiStorm() {
  const toast = useToast();
  const sound = useSound();
  const { t } = useI18n();

  useKonami(() => {
    triggerSplash();
    sound.play('sparkle');
    toast.notify(t.common.secretCode);
  });

  return null;
}
