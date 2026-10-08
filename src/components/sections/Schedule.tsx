import { useMemo, useState, type CSSProperties } from 'react';
import { getPlatform, site } from '../../config/site.ts';
import { useSound } from '../../context/sound.ts';
import { useToast } from '../../context/toast.ts';
import { streamSlots } from '../../data/schedule.ts';
import { useLocalStorage } from '../../hooks/useLocalStorage.ts';
import { useNow } from '../../hooks/useNow.ts';
import { useI18n } from '../../i18n/i18n.ts';
import { localeInfo, type Locale } from '../../i18n/locales.ts';
import type { Messages } from '../../i18n/types.ts';
import { downloadBlob } from '../../lib/download.ts';
import { buildCalendar, type CalendarEvent } from '../../lib/ics.ts';
import { getBrowserTimeZone, getOccurrence, getTimeZoneLabel, getWeekColumns, isValidTimeZone, listTimeZones, type StreamOccurrence } from '../../lib/schedule.ts';
import { Button } from '../ui/Button.tsx';
import { Dropdown } from '../ui/Dropdown.tsx';
import { Icon } from '../ui/Icon.tsx';
import { Panel } from '../ui/Panel.tsx';
import { Reveal } from '../ui/Reveal.tsx';
import { SectionHeading } from '../ui/SectionHeading.tsx';
import { StreamDecor } from '../ui/StreamDecor.tsx';
import styles from './Schedule.module.css';
import { StreamCard } from './StreamCard.tsx';

const BASE_ZONE = site.scheduleTimeZone;
const BASE_CITY = (BASE_ZONE.split('/').pop() ?? BASE_ZONE).replaceAll('_', ' ');

function toCalendarEvent(occurrence: StreamOccurrence, locale: Locale, t: Messages): CalendarEvent {
  const platform = getPlatform(occurrence.slot.platform);
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
  const zoneOptions = useMemo(() => listTimeZones(zone).map((name) => ({ value: name, label: name.replaceAll('_', ' ') })), [zone]);
  const columns = getWeekColumns(streamSlots, now, zone, BASE_ZONE, language);
  const zoneLabel = getTimeZoneLabel(zone, now);
  const isBaseZone = zone === BASE_ZONE;

  const downloadEvents = (events: CalendarEvent[], filename: string) => {
    downloadBlob(new Blob([buildCalendar(events, t.schedule.calendarName(site.name), t.schedule.reminder)], { type: 'text/calendar;charset=utf-8' }), filename);
    sound.play('pop');
    toast.notify(t.schedule.calendarDownloaded);
  };

  const handleDownloadAll = () => {
    downloadEvents(
      streamSlots.map((slot) => toCalendarEvent(getOccurrence(slot, now, BASE_ZONE), locale, t)),
      'mizu-hamzazu-streams.ics',
    );
  };

  const handleDownloadOne = (occurrence: StreamOccurrence) => {
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
            <div className={styles.zoneField}>
              <span className={styles.zoneLabel}>
                <Icon name="clock" size={18} />
                {t.schedule.yourTimeZone}
              </span>
              <Dropdown value={zone} options={zoneOptions} onChange={setStoredZone} label={t.schedule.yourTimeZone} variant="field" />
            </div>

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
              <Button variant="sun" size="sm" icon="calendar" onClick={handleDownloadAll}>
                {t.schedule.addAll}
              </Button>
            </div>
          </Panel>
        </Reveal>

        <ol className={styles.week} aria-label={t.schedule.weekLabel(zoneLabel)}>
          {columns.map((column, index) => (
            <li
              key={column.key}
              className={styles.day}
              data-today={column.isToday}
              data-empty={column.items.length === 0}
              style={{ '--count': column.items.length } as CSSProperties}
            >
              <Reveal variant="pop" delay={index * 60} className={styles.dayReveal}>
                <div className={styles.dayHead}>
                  <span className={styles.weekday}>{column.weekday}</span>
                  <span className={styles.date}>{column.relative ? t.schedule[column.relative] : column.date}</span>
                </div>

                {column.items.length === 0 ? (
                  <p className={styles.rest}>{t.schedule.restDay}</p>
                ) : (
                  <ul className={styles.events}>
                    {column.items.map((occurrence) => (
                      <StreamCard key={occurrence.slot.id} occurrence={occurrence} now={now} zone={zone} onAddToCalendar={handleDownloadOne} />
                    ))}
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
