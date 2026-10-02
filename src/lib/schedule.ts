import type { PlatformId } from '../config/site.ts';

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface StreamSlot {
  id: string;
  title: string;
  description: string;
  weekday: Weekday;
  time: string;
  durationMinutes: number;
  platform: PlatformId;
  membersOnly?: boolean;
}

export interface StreamOccurrence {
  slot: StreamSlot;
  start: number;
  end: number;
}

export type OccurrenceStatus = 'done' | 'live' | 'upcoming';

export interface DayColumn {
  key: string;
  weekday: string;
  date: string;
  relative: string | null;
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
  weekday: Weekday;
}

interface WallDate {
  year: number;
  month: number;
  day: number;
}

const MINUTE = 60_000;
const WEEKDAYS: Record<string, Weekday> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const partsFormatters = new Map<string, Intl.DateTimeFormat>();

function getPartsFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = partsFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      weekday: 'short',
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

export function getZonedParts(epoch: number, timeZone: string): ZonedParts {
  const parts = getPartsFormatter(timeZone).formatToParts(epoch);
  const read = (type: Intl.DateTimeFormatPartTypes): string => parts.find((part) => part.type === type)?.value ?? '0';

  return {
    year: Number(read('year')),
    month: Number(read('month')),
    day: Number(read('day')),
    hour: Number(read('hour')) % 24,
    minute: Number(read('minute')),
    second: Number(read('second')),
    weekday: WEEKDAYS[read('weekday')] ?? 0,
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

function parseTime(time: string): [number, number] {
  const [hour = '0', minute = '0'] = time.split(':');
  return [Number(hour), Number(minute)];
}

function firstStartAtOrAfter(slot: StreamSlot, from: number, baseTimeZone: string): number {
  const [hour, minute] = parseTime(slot.time);
  const today = getZonedParts(from, baseTimeZone);

  for (let ahead = 0; ahead <= 7; ahead += 1) {
    if ((today.weekday + ahead) % 7 !== slot.weekday) continue;
    const start = wallTimeToEpoch(addWallDays(today, ahead), hour, minute, baseTimeZone);
    if (start >= from) return start;
  }

  throw new Error(`No upcoming start found for stream slot "${slot.id}".`);
}

export function getOccurrence(slot: StreamSlot, now: number, baseTimeZone: string): StreamOccurrence {
  const duration = slot.durationMinutes * MINUTE;
  const start = firstStartAtOrAfter(slot, now - duration + 1, baseTimeZone);
  return { slot, start, end: start + duration };
}

export function getNextOccurrence(slots: StreamSlot[], now: number, baseTimeZone: string): StreamOccurrence | null {
  const sorted = slots.map((slot) => getOccurrence(slot, now, baseTimeZone)).sort((a, b) => a.start - b.start);
  return sorted[0] ?? null;
}

export function getStatus(occurrence: StreamOccurrence, now: number): OccurrenceStatus {
  if (now >= occurrence.end) return 'done';
  return now >= occurrence.start ? 'live' : 'upcoming';
}

export function getWeekColumns(
  slots: StreamSlot[],
  now: number,
  viewerTimeZone: string,
  baseTimeZone: string,
): DayColumn[] {
  const today = getZonedParts(now, viewerTimeZone);
  const todayDate: WallDate = { year: today.year, month: today.month, day: today.day };
  const rangeStart = wallTimeToEpoch(todayDate, 0, 0, viewerTimeZone);

  const weekdayFormat = new Intl.DateTimeFormat(undefined, { timeZone: viewerTimeZone, weekday: 'short' });
  const dateFormat = new Intl.DateTimeFormat(undefined, { timeZone: viewerTimeZone, month: 'short', day: 'numeric' });

  const columns: DayColumn[] = Array.from({ length: 7 }, (_, index) => {
    const date = addWallDays(todayDate, index);
    const noon = wallTimeToEpoch(date, 12, 0, viewerTimeZone);
    return {
      key: dayKey(date),
      weekday: weekdayFormat.format(noon),
      date: dateFormat.format(noon),
      relative: index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : null,
      isToday: index === 0,
      items: [],
    };
  });

  for (const slot of slots) {
    const start = firstStartAtOrAfter(slot, rangeStart, baseTimeZone);
    const occurrence: StreamOccurrence = { slot, start, end: start + slot.durationMinutes * MINUTE };
    const parts = getZonedParts(start, viewerTimeZone);
    const column = columns.find((candidate) => candidate.key === dayKey(parts));
    column?.items.push(occurrence);
  }

  columns.forEach((column) => column.items.sort((a, b) => a.start - b.start));
  return columns;
}

export function formatTimeRange(start: number, end: number, timeZone: string): string {
  const format = new Intl.DateTimeFormat(undefined, { timeZone, hour: 'numeric', minute: '2-digit' });
  return `${format.format(start)} – ${format.format(end)}`;
}

export function formatDayAndTime(start: number, timeZone: string): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(start);
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

export function splitDuration(milliseconds: number): { days: number; hours: number; minutes: number; seconds: number } {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}
