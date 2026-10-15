import { useRef, type SyntheticEvent } from 'react';
import { getPlatform } from '../../config/site.ts';
import { useGsap } from '../../hooks/useGsap.ts';
import { useI18n } from '../../i18n/i18n.ts';
import { localeInfo } from '../../i18n/locales.ts';
import { gsap, POP } from '../../lib/motion.ts';
import { formatTimeRange, getStatus, type StreamOccurrence } from '../../lib/schedule.ts';
import { ButtonLink } from '../ui/Button.tsx';
import { Icon } from '../ui/Icon.tsx';
import { platformIcon } from '../ui/platformIcon.ts';
import styles from './Schedule.module.css';

const handleThumbnailError = (event: SyntheticEvent<HTMLImageElement>) => {
  event.currentTarget.hidden = true;
};

function LiveEndedScanlines() {
  const ref = useRef<HTMLDivElement>(null);

  useGsap(ref, () => {
    gsap.fromTo(`.${styles.scanlines}`, { backgroundPositionY: '0px' }, { backgroundPositionY: '20px', duration: 5, ease: 'none', repeat: -1 });

    const flicker = gsap.timeline({ repeat: -1 });
    [
      [0, 1],
      [0.27, 0.55],
      [0.41, 1],
      [2.18, 0.75],
      [2.28, 1],
    ].forEach(([at, opacity]) => flicker.set(`.${styles.scanlines}`, { opacity }, at));
    flicker.to({}, { duration: 0.01 }, 3.4);
  });

  return (
    <div ref={ref} className={styles.endedFx} aria-hidden="true">
      <span className={styles.scanlines} />
    </div>
  );
}

function LiveEndedStamp({ label }: { label: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useGsap(ref, () => {
    gsap.from(ref.current, {
      opacity: 0,
      scale: 1.9,
      duration: 0.55,
      ease: POP,
      scrollTrigger: { trigger: ref.current, start: 'top 92%', once: true },
    });
  });

  return (
    <span ref={ref} className={styles.endedStamp}>
      {label}
    </span>
  );
}

interface StreamCardProps {
  occurrence: StreamOccurrence;
  now: number;
  /** The viewer's time zone, which the time range is shown in. */
  zone: string;
  onAddToCalendar: (occurrence: StreamOccurrence) => void;
}

/** One stream of a day: thumbnail, time, title, status and the watch and calendar buttons. */
export function StreamCard({ occurrence, now, zone, onAddToCalendar }: StreamCardProps) {
  const { locale, t } = useI18n();
  const { slot } = occurrence;
  const status = getStatus(occurrence, now);
  const platform = getPlatform(slot.platform);

  return (
    <li className={styles.event} data-status={status}>
      <div className={styles.media}>
        {slot.thumbnailUrl && (
          <img
            className={styles.thumb}
            src={slot.thumbnailUrl}
            alt={t.schedule.thumbnailAlt(slot.title)}
            width={320}
            height={180}
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={handleThumbnailError}
          />
        )}
      </div>
      {status === 'done' && <LiveEndedScanlines />}

      <div className={styles.eventBody}>
        <div className={styles.timeRow}>
          <p className={styles.time}>
            <Icon name={status === 'live' ? 'play' : 'clock'} size={16} />
            <span>{formatTimeRange(occurrence.start, occurrence.end, zone, localeInfo[locale].htmlLang)}</span>
          </p>
          {status === 'done' && <LiveEndedStamp label={t.schedule.liveEnded} />}
        </div>
        <p className={styles.eventTitle}>{slot.title}</p>
        <p className={styles.eventDesc}>{slot.description[locale]}</p>

        <div className={styles.badges}>
          {status === 'live' && <span className={styles.badgeLive}>{t.schedule.liveNow}</span>}
          {slot.membersOnly && (
            <span className={styles.badge}>
              <Icon name="lock" size={13} />
              {t.schedule.members}
            </span>
          )}
        </div>

        <div className={styles.eventActions}>
          {platform && (
            <ButtonLink
              variant={status === 'live' ? 'primary' : 'secondary'}
              size="sm"
              icon={platformIcon[platform.id]}
              href={platform.liveUrl}
              aria-label={t.schedule.watchOn(slot.title, platform.label)}
            >
              {platform.label}
            </ButtonLink>
          )}
          <button type="button" className={styles.calendarButton} onClick={() => onAddToCalendar(occurrence)} aria-label={t.schedule.addToCalendar(slot.title)}>
            <Icon name="calendar" size={18} />
          </button>
        </div>
      </div>
    </li>
  );
}
