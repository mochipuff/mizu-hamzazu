import { useMemo, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage.ts';
import { playSfx, unlockAudio, type SfxName } from '../lib/audio.ts';
import { SoundContext } from './sound.ts';

export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useLocalStorage('mizu:sound', false);

  const value = useMemo(
    () => ({
      enabled,
      toggle: () => {
        if (!enabled) {
          unlockAudio();
          playSfx('toggle');
        }
        setEnabled(!enabled);
      },
      play: (name: SfxName) => {
        if (enabled) playSfx(name);
      },
    }),
    [enabled, setEnabled],
  );

  return <SoundContext value={value}>{children}</SoundContext>;
}
