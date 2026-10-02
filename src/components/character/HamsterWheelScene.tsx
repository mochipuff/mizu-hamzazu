import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useSound } from '../../context/sound.ts';
import type { EmoteName } from '../../data/emotes.ts';
import { heroDefaultMood, heroImages, heroReactions, pokeLines, pokeMilestones, welcomeLine } from '../../data/hero.ts';
import { emotePng } from '../../lib/assets.ts';
import { triggerSplash } from '../../lib/events.ts';
import styles from './HamsterWheelScene.module.css';

const RESET_MS = 1600;
const SPEECH_MS = 2600;
const SPIN_PER_POKE = 46;

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export function HamsterWheelScene() {
  const sound = useSound();
  const [pokes, setPokes] = useState(0);
  const [mood, setMood] = useState<EmoteName>(heroDefaultMood);
  const [speech, setSpeech] = useState(welcomeLine);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const rippleId = useRef(0);
  const resetTimer = useRef<number | undefined>(undefined);
  const speechTimer = useRef<number | undefined>(undefined);
  const spinTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    for (const name of heroReactions) new Image().src = emotePng(name);
  }, []);

  useEffect(
    () => () => {
      window.clearTimeout(resetTimer.current);
      window.clearTimeout(speechTimer.current);
      window.clearTimeout(spinTimer.current);
    },
    [],
  );

  const poke = useCallback(
    (event: React.PointerEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>) => {
      const next = pokes + 1;
      const rect = event.currentTarget.getBoundingClientRect();
      const isPointer = 'clientX' in event;
      const x = isPointer ? ((event.clientX - rect.left) / rect.width) * 100 : 50;
      const y = isPointer ? ((event.clientY - rect.top) / rect.height) * 100 : 50;

      setRotation((current) => current + SPIN_PER_POKE);
      setPokes(next);
      setMood(heroReactions[next % heroReactions.length] ?? heroDefaultMood);
      setSpeech(pokeMilestones[next] ?? pokeLines[next % pokeLines.length] ?? welcomeLine);
      setRipples((current) => [...current.slice(-3), { id: (rippleId.current += 1), x, y }]);
      setSpinning(true);

      window.clearTimeout(spinTimer.current);
      spinTimer.current = window.setTimeout(() => setSpinning(false), 520);
      window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setMood(heroDefaultMood), RESET_MS);
      window.clearTimeout(speechTimer.current);
      speechTimer.current = window.setTimeout(() => setSpeech(welcomeLine), SPEECH_MS);

      sound.play('bloop');
      if (pokeMilestones[next]) {
        sound.play('sparkle');
        triggerSplash();
      }
    },
    [pokes, sound],
  );

  return (
    <div className={styles.scene}>
      <p className={styles.speech} key={speech} role="status" aria-live="polite">
        {speech}
      </p>

      <button
        type="button"
        className={styles.wheelButton}
        data-spinning={spinning}
        onPointerDown={poke}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            poke(event);
          }
        }}
        aria-label={`Spin the wheel and poke Mizu. Poked ${pokes} ${pokes === 1 ? 'time' : 'times'}.`}
      >
        <div className={styles.art} aria-hidden="true">
          <img className={`${styles.layer} ${styles.stand}`} src={heroImages.stand} alt="" width={400} height={400} draggable={false} />
          <img
            className={`${styles.layer} ${styles.wheel}`}
            src={heroImages.wheel}
            alt=""
            width={400}
            height={400}
            draggable={false}
            style={{ transform: `rotate(${rotation}deg)` }}
          />
          <img className={styles.layer} src={heroImages.stage} alt="" width={400} height={400} draggable={false} />
          <img className={`${styles.face} ${styles.character}`} src={emotePng(mood)} alt="" width={512} height={512} draggable={false} />
        </div>

        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className={styles.ripple}
            style={{ '--x': `${ripple.x}%`, '--y': `${ripple.y}%` } as CSSProperties}
            onAnimationEnd={() => setRipples((current) => current.filter((item) => item.id !== ripple.id))}
          />
        ))}
      </button>

      <p className={styles.hint}>Give the wheel a spin, she reacts.</p>
    </div>
  );
}
