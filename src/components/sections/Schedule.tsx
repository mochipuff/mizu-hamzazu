import { useMemo, useRef, useState, type SyntheticEvent } from 'react';
import { site } from '../../config/site.ts';
import { useSound } from '../../context/sound.ts';
import { useToast } from '../../context/toast.ts';
import { streamSlots } from '../../data/schedule.ts';
import { useGsap } from '../../hooks/useGsap.ts';
import { useLocalStorage } from '../../hooks/useLocalStorage.ts';
import { useNow } from '../../hooks/useNow.ts';
import { useI18n } from '../../i18n/i18n.ts';
import { localeInfo, type Locale } from '../../i18n/locales.ts';
import type { Messages } from '../../i18n/types.ts';
import { downloadBlob } from '../../lib/download.ts';
import { buildCalendar, type CalendarEvent } from '../../lib/ics.ts';
import { gsap, POP } from '../../lib/motion.ts';
import {
  formatTimeRange,
  getBrowserTimeZone,
  getOccurrence,
  getStatus,
  getTimeZoneLabel,
  getWeekColumns,
  isValidTimeZone,
  listTimeZones,
  type StreamOccurrence,
} from '../../lib/schedule.ts';
import { Button, ButtonLink } from '../ui/Button.tsx';
import { Icon } from '../ui/Icon.tsx';
import { Panel } from '../ui/Panel.tsx';
import { platformIcon } from '../ui/platformIcon.ts';
import { Reveal } from '../ui/Reveal.tsx';
import { SectionHeading } from '../ui/SectionHeading.tsx';
import { StreamDecor } from '../ui/StreamDecor.tsx';
import styles from './Schedule.module.css';

const BASE_ZONE = site.scheduleTimeZone;
const BASE_CITY = (BASE_ZONE.split('/').pop() ?? BASE_ZONE).replaceAll('_', ' ');
const platformById = new Map(site.platforms.map((platform) => [platform.id, platform]));

// A broken thumbnail URL should fall back to the plain gradient instead of showing a broken image icon.
const handleThumbnailError = (event: SyntheticEvent<HTMLImageElement>) => {
  event.currentTarget.hidden = true;
};

/** Old-TV scanlines drifting over the thumbnail, with a signal that flickers like a bad antenna. */
function LiveEndedScanlines() {
  const ref = useRef<HTMLDivElement>(null);

  useGsap(ref, () => {
    gsap.fromTo(`.${styles.scanlines}`, { backgroundPositionY: '0px' }, { backgroundPositionY: '20px', duration: 5, ease: 'none', repeat: -1 });

    // Hold each brightness until the next beat.
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

/** A stamp that slams down the first time the card scrolls into view. */
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

function toCalendarEvent(occurrence: StreamOccurrence, locale: Locale, t: Messages): CalendarEvent {
  const platform = platformById.get(occurrence.slot.platform);
  return {
    uid: `${occurrence.slot.id}@mizuhamzazu`,
    start: occurrence.start,
    end: occurrence.end,
    title: `${site.name}: ${occurrence.slot.title}`,
    description: `${occurrence.slot.description[locale]}${occurrence.slot.membersOnly ? t.schedule.membersOnlySuffix : ''}`,
    location: platform?.label ?? '',
    url: platform?.liveUrl ?? site.platforms[0]?.url ?? '',
    weekly: true,
  };
}

export function Schedule() {
  const { locale, t } = useI18n();
  const language = localeInfo[locale].htmlLang;
  const now = useNow();
  const toast = useToast();
  const sound = useSound();
  const [storedZone, setStoredZone] = useLocalStorage<string>('mizu:timezone', '');
  const [detectedZone] = useState(getBrowserTimeZone);

  const zone = storedZone && isValidTimeZone(storedZone) ? storedZone : detectedZone;
  const zones = useMemo(() => listTimeZones(zone), [zone]);
  const columns = getWeekColumns(streamSlots, now, zone, BASE_ZONE, language);
  const zoneLabel = getTimeZoneLabel(zone, now);
  const isBaseZone = zone === BASE_ZONE;

  const downloadEvents = (events: CalendarEvent[], filename: string) => {
    downloadBlob(new Blob([buildCalendar(events, t.schedule.calendarName(site.name), t.schedule.reminder)], { type: 'text/calendar;charset=utf-8' }), filename);
    sound.play('pop');
    toast.notify(t.schedule.calendarDownloaded);
  };

  const downloadAll = () => {
    downloadEvents(
      streamSlots.map((slot) => toCalendarEvent(getOccurrence(slot, now, BASE_ZONE), locale, t)),
      'mizu-hamzazu-streams.ics',
    );
  };

  const downloadOne = (occurrence: StreamOccurrence) => {
    downloadEvents([toCalendarEvent(occurrence, locale, t)], `mizu-${occurrence.slot.id}.ics`);
  };

  return (
    <section id="schedule" className={styles.section} aria-labelledby="schedule-title">
      <StreamDecor />
      <div className="container">
        <SectionHeading headingId="schedule-title" title={t.schedule.title}>
          {t.schedule.lead}
        </SectionHeading>

        <Reveal variant="drop">
          <Panel tone="white" shape="soft" className={styles.controls}>
            <label className={styles.zoneField}>
              <span className={styles.zoneLabel}>
                <Icon name="clock" size={18} />
                {t.schedule.yourTimeZone}
              </span>
              <select
                className={styles.select}
                value={zone}
                onChange={(event) => setStoredZone(event.target.value)}
              >
                {zones.map((name) => (
                  <option key={name} value={name}>
                    {name.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </label>

            <div className={styles.controlActions}>
              {!isBaseZone && (
                <Button variant="secondary" size="sm" onClick={() => setStoredZone(BASE_ZONE)}>
                  {t.schedule.showBaseTime(getTimeZoneLabel(BASE_ZONE, now))}
                </Button>
              )}
              {zone !== detectedZone && (
                <Button variant="secondary" size="sm" onClick={() => setStoredZone(detectedZone)}>
                  {t.schedule.useMyTimeZone}
                </Button>
              )}
              <Button variant="sun" size="sm" icon="calendar" onClick={downloadAll}>
                {t.schedule.addAll}
              </Button>
            </div>
          </Panel>
        </Reveal>

        <ol className={styles.week} aria-label={t.schedule.weekLabel(zoneLabel)}>
          {columns.map((column, index) => (
            <li key={column.key} className={styles.day} data-today={column.isToday} data-empty={column.items.length === 0}>
              <Reveal variant="pop" delay={index * 60} className={styles.dayReveal}>
                <div className={styles.dayHead}>
                  <span className={styles.weekday}>{column.weekday}</span>
                  <span className={styles.date}>{column.relative ? t.schedule[column.relative] : column.date}</span>
                </div>

                {column.items.length === 0 ? (
                  <p className={styles.rest}>{t.schedule.restDay}</p>
                ) : (
                  <ul className={styles.events}>
                    {column.items.map((occurrence) => {
                      const status = getStatus(occurrence, now);
                      const platform = platformById.get(occurrence.slot.platform);
                      return (
                        <li key={occurrence.slot.id} className={styles.event} data-status={status}>
                          <div className={styles.media}>
                            {occurrence.slot.thumbnailUrl && (
                              <img
                                className={styles.thumb}
                                src={occurrence.slot.thumbnailUrl}
                                alt={t.schedule.thumbnailAlt(occurrence.slot.title)}
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
                                <span>{formatTimeRange(occurrence.start, occurrence.end, zone, language)}</span>
                              </p>
                              {status === 'done' && <LiveEndedStamp label={t.schedule.liveEnded} />}
                            </div>
                            <p className={styles.eventTitle}>{occurrence.slot.title}</p>
                            <p className={styles.eventDesc}>{occurrence.slot.description[locale]}</p>

                            <div className={styles.badges}>
                              {status === 'live' && <span className={styles.badgeLive}>{t.schedule.liveNow}</span>}
                              {occurrence.slot.membersOnly && (
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
                                  aria-label={t.schedule.watchOn(occurrence.slot.title, platform.label)}
                                >
                                  {platform.label}
                                </ButtonLink>
                              )}
                              <button
                                type="button"
                                className={styles.calendarButton}
                                onClick={() => downloadOne(occurrence)}
                                aria-label={t.schedule.addToCalendar(occurrence.slot.title)}
                              >
                                <Icon name="calendar" size={18} />
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Reveal>
            </li>
          ))}
        </ol>

        <p className={styles.note}>{t.schedule.note(getTimeZoneLabel(BASE_ZONE, now), BASE_CITY)}</p>
      </div>
    </section>
  );
}
