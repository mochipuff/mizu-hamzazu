import { useMemo, useState, type CSSProperties } from 'react';
import { getPlatform, site } from '../../config/site.ts';
import { useSound } from '../../context/sound.ts';
import { useToast } from '../../context/toast.ts';
import { streamSlots } from '../../data/schedule.ts';
import { useLocalStorage } from '../../hooks/useLocalStorage.ts';
import { useNow } from '../../hooks/useNow.ts';
import { useI18n } from '../../i18n/i18n.ts';
import { localeInfo, type Locale } from '../../i18n/locales.ts';
import type { Messages } from '../../i18n/messages/index.ts';
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

const CRLF = '\r\n';
const encoder = new TextEncoder();

const toIcsDate = (epoch: number): string =>
  new Date(epoch)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

const escapeText = (value: string): string => value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// RFC 5545 limits a line to 75 bytes; longer lines continue on the next line behind a space, never splitting a multibyte character.
function fold(line: string): string {
  if (encoder.encode(line).length <= 75) return line;

  const chunks: string[] = [];
  let current = '';
  let size = 0;

  for (const char of line) {
    const bytes = encoder.encode(char).length;
    if (size + bytes > 75) {
      chunks.push(current);
      current = ` ${char}`;
      size = 1 + bytes;
    } else {
      current += char;
      size += bytes;
    }
  }

  chunks.push(current);
  return chunks.join(CRLF);
}

/** One weekly repeating event per stream, each with a reminder 15 minutes before it starts. */
function buildCalendar(occurrences: StreamOccurrence[], locale: Locale, t: Messages): string {
  const stamp = toIcsDate(Date.now());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mizu Hamzazu//Stream Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(t.schedule.calendarName(site.name))}`,
  ];

  for (const { slot, start, end } of occurrences) {
    const platform = getPlatform(slot.platform);
    const title = `${site.name}: ${slot.title}`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${slot.id}@mizuhamzazu`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${toIcsDate(start)}`,
      `DTEND:${toIcsDate(end)}`,
      'RRULE:FREQ=WEEKLY',
      `SUMMARY:${escapeText(title)}`,
      `DESCRIPTION:${escapeText(`${slot.description[locale]}${slot.membersOnly ? t.schedule.membersOnlySuffix : ''}`)}`,
      `LOCATION:${escapeText(platform?.label ?? '')}`,
      `URL:${platform?.liveUrl ?? site.platforms[0]?.url ?? ''}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(t.schedule.reminder(title))}`,
      'END:VALARM',
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return `${lines.map(fold).join(CRLF)}${CRLF}`;
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

  const downloadCalendar = (occurrences: StreamOccurrence[], filename: string) => {
    const url = URL.createObjectURL(new Blob([buildCalendar(occurrences, locale, t)], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    sound.play('pop');
    toast.notify(t.schedule.calendarDownloaded);
  };

  const handleDownloadAll = () => {
    downloadCalendar(
      streamSlots.map((slot) => getOccurrence(slot, now, BASE_ZONE)),
      'mizu-hamzazu-streams.ics',
    );
  };

  const handleDownloadOne = (occurrence: StreamOccurrence) => {
    downloadCalendar([occurrence], `mizu-${occurrence.slot.id}.ics`);
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
