/**
 * Toronto-timezone date utilities (WEBAPP_SPEC.md section 15: dates always
 * display with a timezone-aware local date; avoid bare UTC conversion).
 *
 * All functions use the Intl API with a fixed timeZone, which is inherently
 * DST-safe. Dates are represented as canonical "YYYY-MM-DD" strings in
 * America/Toronto local time; instants as JS Date.
 */

export const TORONTO_TZ = "America/Toronto";

export interface TorontoParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TORONTO_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** Break an instant into America/Toronto wall-clock parts. */
export function torontoParts(instant: Date): TorontoParts {
  const parts: Record<string, number> = {};
  for (const part of partsFormatter.formatToParts(instant)) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** The Toronto local date "YYYY-MM-DD" for an instant. */
export function torontoDate(instant: Date): string {
  const p = torontoParts(instant);
  return `${pad(p.year)}-${pad(p.month)}-${pad(p.day)}`;
}

/** The current Toronto local date. */
export function torontoToday(now: Date = new Date()): string {
  return torontoDate(now);
}

/** True when the "YYYY-MM-DD" is a real calendar date. */
export function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number) as [number, number, number];
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const probe = new Date(Date.UTC(y, m - 1, d));
  return probe.getUTCFullYear() === y && probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d;
}

function dateKeyToUtcMidnight(key: string): Date {
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d));
}

/** Add days to a "YYYY-MM-DD" (calendar arithmetic on the date itself). */
export function addDays(key: string, days: number): string {
  const date = dateKeyToUtcMidnight(key);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Difference in whole days b - a (both "YYYY-MM-DD"). */
export function daysBetween(a: string, b: string): number {
  const ms = dateKeyToUtcMidnight(b).getTime() - dateKeyToUtcMidnight(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** The UTC instant of Toronto local midnight ending a date (next day 00:00). */
export function endOfDayInstant(key: string): Date {
  // Find the instant whose Toronto wall clock is nextDay 00:00:00.000, then
  // subtract one millisecond. Fixed-point iteration on the zone offset:
  // instant = (wall clock treated as UTC) - offset, and offset depends on the
  // instant. Two or three iterations always converge for America/Toronto
  // (offsets change only at 2 AM local, never at midnight).
  const nextDay = addDays(key, 1);
  const wallClockAsUtc = Date.parse(`${nextDay}T00:00:00Z`);
  let guess = wallClockAsUtc;
  for (let i = 0; i < 3; i += 1) {
    const p = torontoParts(new Date(guess));
    const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    guess = wallClockAsUtc - (asUtc - guess);
  }
  return new Date(guess - 1);
}

/** Short display label, e.g. "Mon, Aug 31" (timezone-safe). */
export function formatDisplayDate(key: string): string {
  const date = dateKeyToUtcMidnight(key);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return formatter.format(date);
}

/** ISO week ordering helper: display "Sep 15" style with year when needed. */
export function formatDisplayDateWithYear(key: string): string {
  const date = dateKeyToUtcMidnight(key);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return formatter.format(date);
}
