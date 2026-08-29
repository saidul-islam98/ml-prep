import {
  REMINDER_DESCRIPTION_PROMPT,
  REMINDER_DURATION_MINUTES,
  REMINDER_LOCAL_TIME,
  REMINDER_TITLE,
  REMINDER_UID,
  TIMEZONE,
  formatLocalStamp,
  formatUtcStamp,
  isValidAppUrl,
  isValidIsoDate,
} from "./reminder";

export { REMINDER_TITLE, REMINDER_DESCRIPTION_PROMPT };

export interface ReminderIcsInput {
  /** First occurrence date, "YYYY-MM-DD" (canonical plan window start). */
  planStartDate: string;
  /** Deployed application URL that the event opens (must be HTTPS). */
  appUrl: string;
  /** Generation time for the required DTSTAMP; defaults to now. */
  now?: Date;
}

/**
 * Escape a TEXT property value per RFC 5545 §3.3.11: backslash, semicolon,
 * and comma are escaped; newlines become literal "\n" / "\N".
 */
function escapeText(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll("\r\n", "\\n")
    .replaceAll("\n", "\\n");
}

/**
 * Fold a content line to at most 75 octets, using the RFC 5545 §3.1
 * continuation ("CRLF" followed by a single white-space character).
 */
function foldContentLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;

  const parts: string[] = [];
  let current = "";
  for (const char of line) {
    const candidate = current + char;
    const octets = encoder.encode(candidate).length + (parts.length > 0 ? 1 : 0);
    if (octets > 75) {
      parts.push(current);
      current = char;
    } else {
      current = candidate;
    }
  }
  if (current) parts.push(current);
  return parts.join("\r\n ");
}

/** Unfold RFC 5545 folded content back into logical lines (test helper). */
export function unfoldIcsLines(ics: string): string[] {
  return ics
    .split("\r\n")
    .reduce<string[]>((lines, raw) => {
      if ((raw.startsWith(" ") || raw.startsWith("\t")) && lines.length > 0) {
        lines[lines.length - 1] = `${lines[lines.length - 1]}${raw.slice(1)}`;
      } else {
        lines.push(raw);
      }
      return lines;
    }, [])
    .filter((line) => line !== "");
}

/**
 * Standards-compatible America/Toronto VTIMEZONE. US/Canada DST rules:
 * daylight from the second Sunday in March (EDT, -0400), standard from the
 * first Sunday in November (EST, -0500). The 1970 dtstart with yearly RRULEs
 * is the conventional portable encoding.
 */
const VTIMEZONE_TORONTO = [
  "BEGIN:VTIMEZONE",
  `TZID:${TIMEZONE}`,
  "BEGIN:DAYLIGHT",
  "DTSTART:19700308T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
  "TZOFFSETFROM:-0500",
  "TZOFFSETTO:-0400",
  "TZNAME:EDT",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "DTSTART:19701101T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
  "TZOFFSETFROM:-0400",
  "TZOFFSETTO:-0500",
  "TZNAME:EST",
  "END:STANDARD",
  "END:VTIMEZONE",
];

function addMinutesToStamp(stamp: string, minutes: number): string {
  const match = /^(\d{8})T(\d{2})(\d{2})(\d{2})$/.exec(stamp);
  if (!match) throw new Error(`Invalid local stamp: ${stamp}`);
  const [, date, h, m, s] = match;
  const total = Number(h) * 60 + Number(m) + minutes;
  const hour = Math.floor(total / 60) % 24;
  const minute = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date}T${pad(hour)}${pad(minute)}${s}`;
}

/**
 * Generate the daily-reminder ICS document. The event is fixed at the
 * product reminder time (5:00 PM America/Toronto), recurs daily, carries a
 * VALARM at event start, and contains no private task data.
 */
export function generateReminderIcs(input: ReminderIcsInput): string {
  const { planStartDate, appUrl, now = new Date() } = input;

  if (!isValidIsoDate(planStartDate)) {
    throw new Error(`Invalid plan start date: "${planStartDate}"`);
  }
  if (!isValidAppUrl(appUrl)) {
    throw new Error(`App URL must use HTTPS (localhost excepted): "${appUrl}"`);
  }

  const dtStart = formatLocalStamp(planStartDate, REMINDER_LOCAL_TIME);
  const dtEnd = addMinutesToStamp(dtStart, REMINDER_DURATION_MINUTES);
  const description = `${REMINDER_DESCRIPTION_PROMPT}\n${appUrl}`;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ml-prep//Cohere Preparation Tracker//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...VTIMEZONE_TORONTO,
    "BEGIN:VEVENT",
    `UID:${REMINDER_UID}`,
    `DTSTAMP:${formatUtcStamp(now)}`,
    `DTSTART;TZID=${TIMEZONE}:${dtStart}`,
    `DTEND;TZID=${TIMEZONE}:${dtEnd}`,
    "RRULE:FREQ=DAILY",
    `SUMMARY:${escapeText(REMINDER_TITLE)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `URL:${appUrl}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `TRIGGER:PT0S`,
    `DESCRIPTION:${escapeText(REMINDER_DESCRIPTION_PROMPT)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.map(foldContentLine).join("\r\n") + "\r\n";
}
