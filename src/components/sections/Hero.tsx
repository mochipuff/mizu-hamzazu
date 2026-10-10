import { useRef } from 'react';
import { getPlatform, site } from '../../config/site.ts';
import { useStreamSlots } from '../../data/schedule.ts';
import { useGsap } from '../../hooks/useGsap.ts';
import { useNow } from '../../hooks/useNow.ts';
import { useI18n } from '../../i18n/i18n.ts';
import { gsap, IDLE } from '../../lib/motion.ts';
import { getNextOccurrence, getStatus, splitDuration } from '../../lib/schedule.ts';
import { HamsterWheelScene } from '../character/HamsterWheelScene.tsx';
import { ButtonLink } from '../ui/Button.tsx';
import { Sparkle, Starfish } from '../ui/Doodles.tsx';
import { platformIcon } from '../ui/platformIcon.ts';
import styles from './Hero.module.css';

const pad = (value: number): string => String(value).padStart(2, '0');

function NextStream() {
  const { t } = useI18n();
  const now = useNow();
  const { slots } = useStreamSlots();
  const dotRef = useRef<HTMLSpanElement>(null);
  const occurrence = getNextOccurrence(slots, now);
  const live = occurrence ? getStatus(occurrence, now) === 'live' : false;

  useGsap(
    dotRef,
    () => {
      if (dotRef.current) gsap.to(dotRef.current, { scale: 1.35, opacity: 0.6, duration: 0.6, ease: IDLE, yoyo: true, repeat: -1 });
    },
    [live],
  );

  if (!occurrence) return null;

  const platform = getPlatform(occurrence.slot.platform);
  const { days, hours, minutes } = splitDuration(occurrence.start - now);

  return (
    <div className={styles.next} data-live={live}>
      <p className={styles.nextLabel}>
        {live && <span ref={dotRef} className={styles.liveDot} aria-hidden="true" />}
        {live ? t.hero.liveNow : t.hero.nextStream}
      </p>
      <p className={styles.nextTitle}>{occurrence.slot.title}</p>
      {live ? (
        <ButtonLink variant="primary" size="md" icon={platformIcon[occurrence.slot.platform]} href={platform?.liveUrl ?? site.platforms[0]?.url ?? '#'}>
          {t.hero.joinStream}
        </ButtonLink>
      ) : (
        <p className={styles.clock} role="timer" aria-label={t.hero.startsIn(days, hours, minutes)}>
          {days > 0 && (
            <span>
              <b>{days}</b>
              {t.hero.units.day}
            </span>
          )}
          <span>
            <b>{pad(hours)}</b>
            {t.hero.units.hour}
          </span>
          <span>
            <b>{pad(minutes)}</b>
            {t.hero.units.minute}
          </span>
        </p>
      )}
    </div>
  );
}

export function Hero() {
  const { t } = useI18n();
  const ref = useRef<HTMLElement>(null);

  useGsap(ref, () => {
    gsap.fromTo(`.${styles.starfishA}`, { rotation: 14 }, { rotation: 374, duration: 14, ease: 'none', repeat: -1 });
    const twinkle = { scale: 0.6, opacity: 0.5, duration: 1.5, ease: IDLE, yoyo: true, repeat: -1 };
    gsap.to(`.${styles.sparkleA}`, twinkle);
    gsap.to(`.${styles.sparkleB}`, { ...twinkle, delay: 1.3 });
  });

  return (
    <section ref={ref} id="top" className={styles.hero} aria-labelledby="hero-title">
      <Starfish className={styles.starfishA} />
      <Sparkle className={styles.sparkleA} color="#ffffff" />
      <Sparkle className={styles.sparkleB} color="var(--sun)" />

      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <p className={styles.tag}>{t.hero.tag}</p>
          <h1 id="hero-title" className={styles.title}>
            <span className={styles.line}>{t.hero.greeting}</span>
            <span className={styles.name}>{t.hero.iAm(site.nickname)}</span>
          </h1>
          <p className={styles.intro}>{t.hero.intro}</p>

          <div className={styles.actions}>
            {site.platforms
              .filter((platform) => platform.id === 'youtube' || platform.id === 'twitch')
              .map((platform, index) => (
                <ButtonLink
                  key={platform.id}
                  variant={index === 0 ? 'primary' : 'secondary'}
                  size="lg"
                  icon={platformIcon[platform.id]}
                  href={platform.url}
                >
                  {t.platforms[platform.id].cta}
                </ButtonLink>
              ))}
          </div>

          <NextStream />
        </div>

        <div className={styles.stage}>
          <HamsterWheelScene />
        </div>
      </div>
    </section>
  );
}
