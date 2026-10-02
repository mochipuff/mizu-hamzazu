import { site } from '../../config/site.ts';
import { heroIntro } from '../../data/hero.ts';
import { streamSlots } from '../../data/schedule.ts';
import { useNow } from '../../hooks/useNow.ts';
import { getNextOccurrence, getStatus, splitDuration } from '../../lib/schedule.ts';
import { HamsterWheelScene } from '../character/HamsterWheelScene.tsx';
import { ButtonLink } from '../ui/Button.tsx';
import { Sparkle, Starfish } from '../ui/Doodles.tsx';
import { platformIcon } from '../ui/platformIcon.ts';
import styles from './Hero.module.css';

const pad = (value: number): string => String(value).padStart(2, '0');

function NextStream() {
  const now = useNow();
  const occurrence = getNextOccurrence(streamSlots, now, site.scheduleTimeZone);

  if (!occurrence) return null;

  const platform = site.platforms.find((candidate) => candidate.id === occurrence.slot.platform);
  const live = getStatus(occurrence, now) === 'live';
  const { days, hours, minutes } = splitDuration(occurrence.start - now);

  return (
    <div className={styles.next} data-live={live}>
      <p className={styles.nextLabel}>{live ? 'Live right now' : 'Next stream'}</p>
      <p className={styles.nextTitle}>{occurrence.slot.title}</p>
      {live ? (
        <ButtonLink variant="primary" size="md" icon={platformIcon[occurrence.slot.platform]} href={platform?.liveUrl ?? site.platforms[0]?.url ?? '#'}>
          Join the stream
        </ButtonLink>
      ) : (
        <p className={styles.clock} role="timer" aria-label={`Starts in ${days} days, ${hours} hours, ${minutes} minutes`}>
          {days > 0 && (
            <span>
              <b>{days}</b>d
            </span>
          )}
          <span>
            <b>{pad(hours)}</b>h
          </span>
          <span>
            <b>{pad(minutes)}</b>m
          </span>
        </p>
      )}
    </div>
  );
}

export function Hero() {
  return (
    <section id="top" className={styles.hero} aria-labelledby="hero-title">
      <Starfish className={styles.starfishA} />
      <Sparkle className={styles.sparkleA} color="#ffffff" />
      <Sparkle className={styles.sparkleB} color="var(--sun)" />

      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <p className={styles.tag}>Virtual Youtuber</p>
          <h1 id="hero-title" className={styles.title}>
            <span className={styles.line}>Cihuyyy,</span>
            <span className={styles.name}>I&rsquo;m {site.nickname}!</span>
          </h1>
          <p className={styles.intro}>{heroIntro}</p>

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
                  {platform.cta}
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
