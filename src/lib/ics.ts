export interface CalendarEvent {
  uid: string;
  start: number;
  end: number;
  title: string;
  description: string;
  location: string;
  url: string;
  weekly: boolean;
}

const CRLF = '\r\n';
const encoder = new TextEncoder();

const toIcsDate = (epoch: number): string =>
  new Date(epoch)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

const escapeText = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

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

export function buildCalendar(events: CalendarEvent[], calendarName: string): string {
  const stamp = toIcsDate(Date.now());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mizu Hamzazu//Stream Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
  ];

  for (const event of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${toIcsDate(event.start)}`,
      `DTEND:${toIcsDate(event.end)}`,
      ...(event.weekly ? ['RRULE:FREQ=WEEKLY'] : []),
      `SUMMARY:${escapeText(event.title)}`,
      `DESCRIPTION:${escapeText(event.description)}`,
      `LOCATION:${escapeText(event.location)}`,
      `URL:${event.url}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(`${event.title} starts in 15 minutes`)}`,
      'END:VALARM',
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return `${lines.map(fold).join(CRLF)}${CRLF}`;
}
