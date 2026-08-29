/**
 * Fixed reminder constants (WEBAPP_SPEC.md §9, §2). The reminder time and
 * timezone are product-fixed in MVP at 5:00 PM America/Toronto; changing them
 * is deferred because an imported calendar event cannot be reliably edited by
 * this static app.
 */

export const TIMEZONE = "America/Toronto" as const;

/** Local wall-clock time of the daily reminder, 24h "HH:mm". */
export const REMINDER_LOCAL_TIME = "17:00" as const;

/** Reminder duration in minutes. */
export const REMINDER_DURATION_MINUTES = 15 as const;

/** Reminder title. Contains no private task details. */
export const REMINDER_TITLE = "Cohere preparation check-in" as const;

/** Generic reminder prompt. Contains no private task details. */
export const REMINDER_DESCRIPTION_PROMPT =
  "Cohere preparation: review and complete today's tasks." as const;

/** Stable UID base for calendar event identity across regenerations. */
export const REMINDER_UID = "cohere-preparation-checkin-daily@ml-prep-tracker" as const;

/** Parse "HH:mm" into { hour, minute }, or null when invalid. */
export function parseLocalTime(value: string): { hour: number; minute: number } | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

/** Validate a calendar date string "YYYY-MM-DD" against the real calendar. */
export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number) as [number, number, number];
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const probe = new Date(Date.UTC(y, m - 1, d));
  return probe.getUTCFullYear() === y && probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d;
}

/** Compose a compact UTC timestamp "YYYYMMDDTHHMMSSZ" from a Date. */
export function formatUtcStamp(date: Date): string {
  const pad = (n: number, width = 2) => String(n).padStart(width, "0");
  return (
    `${pad(date.getUTCFullYear(), 4)}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

/** Compose a compact local datetime "YYYYMMDDTHHMMSS" from date + "HH:mm". */
export function formatLocalStamp(isoDate: string, localTime: string): string {
  const time = parseLocalTime(localTime);
  if (!time) throw new Error(`Invalid local time: ${localTime}`);
  if (!isValidIsoDate(isoDate)) throw new Error(`Invalid date: ${isoDate}`);
  const digits = isoDate.replaceAll("-", "");
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${digits}T${pad(time.hour)}${pad(time.minute)}00`;
}
