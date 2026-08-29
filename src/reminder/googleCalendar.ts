import {
  REMINDER_DESCRIPTION_PROMPT,
  REMINDER_DURATION_MINUTES,
  REMINDER_LOCAL_TIME,
  REMINDER_TITLE,
  TIMEZONE,
  formatLocalStamp,
  isValidAppUrl,
  isValidIsoDate,
  parseLocalTime,
} from "./reminder";

export interface GoogleCalendarUrlInput {
  /** First occurrence date, "YYYY-MM-DD" (canonical plan window start). */
  planStartDate: string;
  /** Deployed application URL the reminder opens (must be HTTPS). */
  appUrl: string;
}

/**
 * Build a prefilled Google Calendar event-creation URL. Google template links
 * do not accept a TZID; the naive start/end times are combined with `ctz`
 * (calendar timezone) so Google interprets them in America/Toronto and the
 * daily recurrence follows DST there. Per WEBAPP_SPEC.md §9.1, the `.ics`
 * file remains the canonical fallback because Google URL behavior may differ
 * across clients; one manual Android verification is part of acceptance.
 */
export function buildGoogleCalendarUrl(input: GoogleCalendarUrlInput): string {
  const { planStartDate, appUrl } = input;

  if (!isValidIsoDate(planStartDate)) {
    throw new Error(`Invalid plan start date: "${planStartDate}"`);
  }
  if (!isValidAppUrl(appUrl)) {
    throw new Error(`App URL must use HTTPS (localhost excepted): "${appUrl}"`);
  }
  const startTime = parseLocalTime(REMINDER_LOCAL_TIME);
  if (!startTime) {
    throw new Error(`Invalid reminder time: "${REMINDER_LOCAL_TIME}"`);
  }

  const start = formatLocalStamp(planStartDate, REMINDER_LOCAL_TIME);
  const startTotalMinutes = startTime.hour * 60 + startTime.minute;
  const endTotalMinutes = startTotalMinutes + REMINDER_DURATION_MINUTES;
  const endHour = Math.floor(endTotalMinutes / 60);
  const endMinute = endTotalMinutes % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const end = `${start.slice(0, 9)}${pad(endHour)}${pad(endMinute)}00`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: REMINDER_TITLE,
    dates: `${start}/${end}`,
    ctz: TIMEZONE,
    recur: "RRULE:FREQ=DAILY",
    details: `${REMINDER_DESCRIPTION_PROMPT} ${appUrl}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
