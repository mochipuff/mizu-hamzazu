import { createContext, useContext } from 'react';
import type { SfxName } from '../lib/audio.ts';

export interface SoundApi {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
  play: (name: SfxName) => void;
}

export const SoundContext = createContext<SoundApi | null>(null);

export function useSound(): SoundApi {
  const context = useContext(SoundContext);
  if (!context) throw new Error('useSound must be used inside <SoundProvider>.');
  return context;
}
