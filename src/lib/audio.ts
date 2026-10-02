export type SfxName = 'bloop' | 'pop' | 'gold' | 'copy' | 'toggle' | 'sparkle';

interface ToneOptions {
  from: number;
  to: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
}

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null;
  context ??= new AudioContext();
  if (context.state === 'suspended') void context.resume();
  return context;
}

function tone(audio: AudioContext, { from, to, duration, type = 'sine', gain = 0.14, delay = 0 }: ToneOptions): void {
  const start = audio.currentTime + delay;
  const oscillator = audio.createOscillator();
  const amp = audio.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, start);
  oscillator.frequency.exponentialRampToValueAtTime(to, start + duration);

  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(amp).connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

const arpeggio = (audio: AudioContext, notes: number[], step: number, type: OscillatorType = 'triangle'): void => {
  notes.forEach((note, index) => {
    tone(audio, { from: note, to: note * 1.01, duration: 0.16, type, delay: index * step });
  });
};

const recipes: Record<SfxName, (audio: AudioContext) => void> = {
  bloop: (audio) => tone(audio, { from: 300, to: 820, duration: 0.16 }),
  pop: (audio) => tone(audio, { from: 920, to: 260, duration: 0.09, type: 'triangle', gain: 0.16 }),
  gold: (audio) => arpeggio(audio, [660, 880, 1320], 0.07),
  copy: (audio) => {
    tone(audio, { from: 520, to: 640, duration: 0.07 });
    tone(audio, { from: 780, to: 900, duration: 0.09, delay: 0.07 });
  },
  toggle: (audio) => tone(audio, { from: 440, to: 660, duration: 0.09, type: 'triangle' }),
  sparkle: (audio) => arpeggio(audio, [880, 1108, 1318, 1760], 0.06),
};

export function unlockAudio(): void {
  getContext();
}

export function playSfx(name: SfxName): void {
  const audio = getContext();
  if (audio) recipes[name](audio);
}
