import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { useSound } from '../../context/sound.ts';
import type { EmoteName } from '../../data/emotes.ts';
import { heroDefaultMood, heroImages, heroReactions } from '../../data/hero.ts';
import { useGsap } from '../../hooks/useGsap.ts';
import { useI18n } from '../../i18n/i18n.ts';
import { emoteUrl } from '../../lib/assets.ts';
import { triggerSplash } from '../../lib/events.ts';
import { gsap, IDLE, POP, prefersReducedMotion } from '../../lib/motion.ts';
import styles from './HamsterWheelScene.module.css';

const RESET_MS = 1600;
const SPEECH_MS = 2600;
const SPIN_PER_POKE = 46;

type SpeechId = 'welcome' | number;

interface Ripple {
  id: number;
  x: number;
  y: number;
}

function RippleRing({ id, x, y, onDone }: { id: number; x: number; y: number; onDone: (id: number) => void }) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const tween = gsap.fromTo(
      ref.current,
      { scale: 0.4, opacity: 1 },
      { scale: 3.4, opacity: 0, duration: prefersReducedMotion() ? 0.01 : 0.8, ease: 'power1.out', onComplete: () => onDone(id) },
    );
    return () => void tween.kill();
  }, [id, onDone]);

  return <span ref={ref} className={styles.ripple} style={{ '--x': `${x}%`, '--y': `${y}%` } as CSSProperties} />;
}

export function HamsterWheelScene() {
  const sound = useSound();
  const { t } = useI18n();
  const [pokes, setPokes] = useState(0);
  const [mood, setMood] = useState<EmoteName>(heroDefaultMood);
  const [speechId, setSpeechId] = useState<SpeechId>('welcome');
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const sceneRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<HTMLImageElement>(null);
  const characterRef = useRef<HTMLImageElement>(null);
  const spinTarget = useRef(0);
  const rippleId = useRef(0);
  const resetTimer = useRef<number | undefined>(undefined);
  const speechTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const wheel = wheelRef.current;
    return () => {
      window.clearTimeout(resetTimer.current);
      window.clearTimeout(speechTimer.current);
      gsap.killTweensOf(wheel);
    };
  }, []);

  useGsap(sceneRef, () => {
    gsap.to(`.${styles.wheelButton}`, { y: -8, duration: 3, ease: IDLE, yoyo: true, repeat: -1 });
    gsap.to(characterRef.current, { y: 4, duration: 1.7, ease: IDLE, yoyo: true, repeat: -1 });
  });

  const handleRippleDone = useCallback((id: number) => setRipples((current) => current.filter((ripple) => ripple.id !== id)), []);

  const { welcome, pokeLines, pokeMilestones } = t.hero;
  const speech = speechId === 'welcome' ? welcome : (pokeMilestones[speechId] ?? pokeLines[speechId % pokeLines.length] ?? welcome);

  useGsap(sceneRef, () => void gsap.from(`.${styles.speech}`, { opacity: 0, scale: 0.7, y: 8, duration: 0.35, ease: POP }), [speechId]);

  const handlePoke = (event: PointerEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>) => {
    const next = pokes + 1;
    const rect = event.currentTarget.getBoundingClientRect();
    const isPointer = 'clientX' in event;
    const x = isPointer ? ((event.clientX - rect.left) / rect.width) * 100 : 50;
    const y = isPointer ? ((event.clientY - rect.top) / rect.height) * 100 : 50;

    spinTarget.current += SPIN_PER_POKE;
    gsap.to(wheelRef.current, { rotation: spinTarget.current, duration: prefersReducedMotion() ? 0 : 0.52, ease: POP, overwrite: 'auto' });
    setPokes(next);
    setMood(heroReactions[next % heroReactions.length] ?? heroDefaultMood);
    setSpeechId(next);
    setRipples((current) => [...current.slice(-3), { id: (rippleId.current += 1), x, y }]);

    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setMood(heroDefaultMood), RESET_MS);
    window.clearTimeout(speechTimer.current);
    speechTimer.current = window.setTimeout(() => setSpeechId('welcome'), SPEECH_MS);

    sound.play('bloop');
    if (pokeMilestones[next]) {
      sound.play('sparkle');
      triggerSplash();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    handlePoke(event);
  };

  return (
    <div ref={sceneRef} className={styles.scene}>
      <p className={styles.speech} key={speechId} role="status" aria-live="polite">
        {speech}
      </p>

      <button
        type="button"
        className={styles.wheelButton}
        onPointerDown={handlePoke}
        onKeyDown={handleKeyDown}
        aria-label={t.hero.pokeLabel(pokes)}
      >
        <span className={styles.art} aria-hidden="true">
          <img className={`${styles.layer} ${styles.stand}`} src={heroImages.stand} alt="" width={400} height={400} fetchPriority="high" draggable={false} />
          <img ref={wheelRef} className={styles.layer} src={heroImages.wheel} alt="" width={400} height={400} fetchPriority="high" draggable={false} />
          <img className={styles.layer} src={heroImages.stage} alt="" width={400} height={400} fetchPriority="high" draggable={false} />
          <img ref={characterRef} className={styles.face} src={emoteUrl(mood)} alt="" width={512} height={512} draggable={false} />
        </span>

        {ripples.map((ripple) => (
          <RippleRing key={ripple.id} id={ripple.id} x={ripple.x} y={ripple.y} onDone={handleRippleDone} />
        ))}
      </button>

      <p className={styles.hint}>{t.hero.spinHint}</p>
    </div>
  );
}
