import { useCallback, useMemo, type ReactNode } from 'react';
import { playSfx, unlockAudio, type SfxName } from '../lib/audio.ts';
import { useLocalStorage } from '../hooks/useLocalStorage.ts';
import { SoundContext } from './sound.ts';

export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setStoredEnabled] = useLocalStorage('mizu:sound', false);

  const setEnabled = useCallback(
    (next: boolean) => {
      if (next) {
        unlockAudio();
        playSfx('toggle');
      }
      setStoredEnabled(next);
    },
    [setStoredEnabled],
  );

  const toggle = useCallback(() => setEnabled(!enabled), [enabled, setEnabled]);

  const play = useCallback(
    (name: SfxName) => {
      if (enabled) playSfx(name);
    },
    [enabled],
  );

  const value = useMemo(() => ({ enabled, setEnabled, toggle, play }), [enabled, setEnabled, toggle, play]);

  return <SoundContext value={value}>{children}</SoundContext>;
}
