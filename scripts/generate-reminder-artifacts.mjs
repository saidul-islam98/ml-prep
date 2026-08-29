/**
 * Generates the reminder feasibility artifacts for the manual Android check
 * (docs/calendar-spike.md):
 *   - /tmp/reminder.ics
 *   - prints the Google Calendar template URL
 *
 * Usage: npx tsx scripts/generate-reminder-artifacts.mjs "https://<owner>.github.io/<repo>/#/today"
 */

import { writeFileSync } from "node:fs";
import { generateReminderIcs } from "../src/reminder/ical";
import { buildGoogleCalendarUrl } from "../src/reminder/googleCalendar";

const appUrl = process.argv[2];
if (!appUrl) {
  console.error(
    'Usage: npx tsx scripts/generate-reminder-artifacts.mjs "https://<app-url>/#/today"',
  );
  process.exit(1);
}

const ics = generateReminderIcs({ planStartDate: "2026-08-31", appUrl });
writeFileSync("/tmp/reminder.ics", ics);
console.log("Wrote /tmp/reminder.ics");
console.log("Google Calendar URL:");
console.log(buildGoogleCalendarUrl({ planStartDate: "2026-08-31", appUrl }));
