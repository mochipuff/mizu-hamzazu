import type { PlatformId } from '../config/site.ts';
import type { Localized } from '../i18n/locales.ts';

export interface StreamSlot {
  id: string;
  title: string;
  description: Localized;
  /** ISO 8601 with a UTC offset, as the API sends it. */
  datetime: string;
  durationMinutes: number;
  platform: PlatformId;
  membersOnly: boolean;
  thumbnailUrl: string | null;
}

export interface StreamOccurrence {
  slot: StreamSlot;
  start: number;
  end: number;
}

type OccurrenceStatus = 'done' | 'live' | 'upcoming';

interface DayColumn {
  key: string;
  weekday: string;
  date: string;
  relative: 'today' | 'tomorrow' | null;
  isToday: boolean;
  items: StreamOccurrence[];
}

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

interface WallDate {
  year: number;
  month: number;
  day: number;
}

const MINUTE = 60_000;
const RELATIVE_DAYS = ['today', 'tomorrow'] as const;

const partsFormatters = new Map<string, Intl.DateTimeFormat>();

function getPartsFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = partsFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    partsFormatters.set(timeZone, formatter);
  }
  return formatter;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

function getZonedParts(epoch: number, timeZone: string): ZonedParts {
  const parts = getPartsFormatter(timeZone).formatToParts(epoch);
  const read = (type: Intl.DateTimeFormatPartTypes): string => parts.find((part) => part.type === type)?.value ?? '0';

  return {
    year: Number(read('year')),
    month: Number(read('month')),
    day: Number(read('day')),
    hour: Number(read('hour')) % 24,
    minute: Number(read('minute')),
    second: Number(read('second')),
  };
}

function getOffset(epoch: number, timeZone: string): number {
  const parts = getZonedParts(epoch, timeZone);
  const wallAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return wallAsUtc - Math.floor(epoch / 1000) * 1000;
}

function wallTimeToEpoch(date: WallDate, hour: number, minute: number, timeZone: string): number {
  const naive = Date.UTC(date.year, date.month - 1, date.day, hour, minute);
  const firstGuess = naive - getOffset(naive, timeZone);
  return naive - getOffset(firstGuess, timeZone);
}

function addWallDays(date: WallDate, days: number): WallDate {
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() };
}

const dayKey = (date: WallDate): string => `${date.year}-${date.month}-${date.day}`;

export function getOccurrence(slot: StreamSlot): StreamOccurrence {
  const start = Date.parse(slot.datetime);
  return { slot, start, end: start + slot.durationMinutes * MINUTE };
}

/** The stream that is live now, or else the next one to start. */
export function getNextOccurrence(slots: StreamSlot[], now: number): StreamOccurrence | null {
  const upcoming = slots.map(getOccurrence).filter((occurrence) => occurrence.end > now);
  return upcoming.sort((a, b) => a.start - b.start)[0] ?? null;
}

export function getStatus(occurrence: StreamOccurrence, now: number): OccurrenceStatus {
  if (now >= occurrence.end) return 'done';
  return now >= occurrence.start ? 'live' : 'upcoming';
}

export function getWeekColumns(slots: StreamSlot[], now: number, viewerTimeZone: string, language: string): DayColumn[] {
  const today = getZonedParts(now, viewerTimeZone);
  const todayDate: WallDate = { year: today.year, month: today.month, day: today.day };
  const rangeStart = wallTimeToEpoch(todayDate, 0, 0, viewerTimeZone);

  const weekdayFormat = new Intl.DateTimeFormat(language, { timeZone: viewerTimeZone, weekday: 'short' });
  const dateFormat = new Intl.DateTimeFormat(language, { timeZone: viewerTimeZone, month: 'short', day: 'numeric' });

  const columns: DayColumn[] = Array.from({ length: 7 }, (_, index) => {
    const date = addWallDays(todayDate, index);
    const noon = wallTimeToEpoch(date, 12, 0, viewerTimeZone);
    return {
      key: dayKey(date),
      weekday: weekdayFormat.format(noon),
      date: dateFormat.format(noon),
      relative: RELATIVE_DAYS[index] ?? null,
      isToday: index === 0,
      items: [],
    };
  });

  for (const slot of slots) {
    const occurrence = getOccurrence(slot);
    if (occurrence.end <= rangeStart) continue;
    const column = columns.find((candidate) => candidate.key === dayKey(getZonedParts(occurrence.start, viewerTimeZone))) ?? (occurrence.start < rangeStart ? columns[0] : undefined);
    column?.items.push(occurrence);
  }

  columns.forEach((column) => column.items.sort((a, b) => a.start - b.start));
  return columns;
}

export function formatTimeRange(start: number, end: number, timeZone: string, language: string): string {
  const format = new Intl.DateTimeFormat(language, { timeZone, hour: 'numeric', minute: '2-digit' });
  return `${format.format(start)} – ${format.format(end)}`;
}

export function getTimeZoneLabel(timeZone: string, epoch: number): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' }).formatToParts(epoch);
  return parts.find((part) => part.type === 'timeZoneName')?.value ?? timeZone;
}

export function getBrowserTimeZone(): string {
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return detected && isValidTimeZone(detected) ? detected : 'UTC';
}

export function listTimeZones(current: string): string[] {
  const zones = new Set<string>(typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : []);
  zones.add('UTC');
  zones.add(current);
  return [...zones].sort((a, b) => a.localeCompare(b));
}

export function splitDuration(milliseconds: number): { days: number; hours: number; minutes: number } {
  const totalMinutes = Math.max(0, Math.floor(milliseconds / MINUTE));
  return {
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
  };
}
