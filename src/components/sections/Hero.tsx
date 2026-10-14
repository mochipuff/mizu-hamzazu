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
import { LiveButton } from '../ui/LiveButton.tsx';
import { platformIcon } from '../ui/platformIcon.ts';
import styles from './Hero.module.css';

const pad = (value: number): string => String(value).padStart(2, '0');

/** The stream that is on now or else the next one, and whether it is on. */
function useNextStream() {
  const now = useNow();
  const { slots } = useStreamSlots();
  const occurrence = getNextOccurrence(slots, now);
  return { now, occurrence, live: occurrence ? getStatus(occurrence, now) === 'live' : false };
}

/** Watch buttons for YouTube and Twitch. The one for the platform that is streaming right now turns into the animated Now live button. */
function HeroActions() {
  const { t } = useI18n();
  const { occurrence, live } = useNextStream();
  const livePlatform = live ? occurrence?.slot.platform : undefined;

  return (
    <div className={styles.actions}>
      {site.platforms
        .filter((platform) => platform.id === 'youtube' || platform.id === 'twitch')
        .map((platform, index) =>
          platform.id === livePlatform ? (
            <LiveButton key={platform.id} size="lg" href={platform.liveUrl} aria-label={t.hero.nowLiveOn(platform.label)}>
              {t.hero.nowLive}
            </LiveButton>
          ) : (
            <ButtonLink key={platform.id} variant={index === 0 ? 'primary' : 'secondary'} size="lg" icon={platformIcon[platform.id]} href={platform.url}>
              {t.platforms[platform.id].cta}
            </ButtonLink>
          ),
        )}
    </div>
  );
}

function NextStream() {
  const { t } = useI18n();
  const { now, occurrence, live } = useNextStream();
  const dotRef = useRef<HTMLSpanElement>(null);

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

          <HeroActions />

          <NextStream />
        </div>

        <div className={styles.stage}>
          <HamsterWheelScene />
        </div>
      </div>
    </section>
  );
}
