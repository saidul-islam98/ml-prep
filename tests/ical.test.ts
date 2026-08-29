import { describe, expect, it } from "vitest";
import {
  generateReminderIcs,
  unfoldIcsLines,
  REMINDER_TITLE,
  REMINDER_DESCRIPTION_PROMPT,
} from "../src/reminder/ical";
import { REMINDER_LOCAL_TIME, REMINDER_DURATION_MINUTES, TIMEZONE } from "../src/reminder/reminder";

const PLAN_START_DATE = "2026-08-31"; // canonical plan window start, America/Toronto
const APP_URL = "https://example.github.io/ml-prep/#/today";
const NOW = new Date("2026-08-29T12:00:00Z");

describe("generateReminderIcs", () => {
  const ics = generateReminderIcs({
    planStartDate: PLAN_START_DATE,
    appUrl: APP_URL,
    now: NOW,
  });

  it("uses the fixed reminder time and duration constants", () => {
    expect(REMINDER_LOCAL_TIME).toBe("17:00");
    expect(REMINDER_DURATION_MINUTES).toBe(15);
    expect(TIMEZONE).toBe("America/Toronto");
  });

  it("starts with VCALENDAR scaffolding", () => {
    expect(ics).toMatch(/^BEGIN:VCALENDAR\r\n/);
    expect(ics).toContain("VERSION:2.0\r\n");
    expect(ics).toContain("PRODID:");
    expect(ics).toContain("CALSCALE:GREGORIAN\r\n");
    expect(ics).toMatch(/END:VCALENDAR\r\n$/);
  });

  it("contains a standards-complete America/Toronto VTIMEZONE with DST rules", () => {
    expect(ics).toContain("BEGIN:VTIMEZONE\r\n");
    expect(ics).toContain("TZID:America/Toronto\r\n");
    // Daylight rule: second Sunday of March, EDT (-0400).
    expect(ics).toContain("BEGIN:DAYLIGHT\r\n");
    expect(ics).toContain("DTSTART:19700308T020000\r\n");
    expect(ics).toContain("RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU\r\n");
    expect(ics).toContain("TZOFFSETFROM:-0500\r\n");
    expect(ics).toContain("TZOFFSETTO:-0400\r\n");
    expect(ics).toContain("TZNAME:EDT\r\n");
    // Standard rule: first Sunday of November, EST (-0500).
    expect(ics).toContain("BEGIN:STANDARD\r\n");
    expect(ics).toContain("DTSTART:19701101T020000\r\n");
    expect(ics).toContain("RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU\r\n");
    expect(ics).toContain("TZOFFSETFROM:-0400\r\n");
    expect(ics).toContain("TZOFFSETTO:-0500\r\n");
    expect(ics).toContain("TZNAME:EST\r\n");
  });

  it("schedules the event at 5:00 PM Toronto time on the plan start date", () => {
    expect(ics).toContain("DTSTART;TZID=America/Toronto:20260831T170000\r\n");
    expect(ics).toContain("DTEND;TZID=America/Toronto:20260831T171500\r\n");
  });

  it("recurs daily", () => {
    expect(ics).toContain("RRULE:FREQ=DAILY\r\n");
  });

  it("includes a VALARM that fires at event start", () => {
    expect(ics).toContain("BEGIN:VALARM\r\n");
    expect(ics).toContain("ACTION:DISPLAY\r\n");
    expect(ics).toContain("TRIGGER:PT0S\r\n");
    expect(ics).toContain("END:VALARM\r\n");
  });

  it("uses a stable UID independent of generation time", () => {
    const again = generateReminderIcs({
      planStartDate: PLAN_START_DATE,
      appUrl: APP_URL,
      now: new Date("2027-01-01T00:00:00Z"),
    });
    const uid = (text: string) => text.match(/UID:(.+)\r\n/)?.[1];
    expect(uid(again)).toBe(uid(ics));
    expect(uid(ics)).toBeTruthy();
  });

  it("requires a DTSTAMP in UTC", () => {
    expect(ics).toContain("DTSTAMP:20260829T120000Z\r\n");
  });

  it("carries the generic reminder title and prompt, and the app URL", () => {
    expect(ics).toContain(`SUMMARY:${REMINDER_TITLE}\r\n`);
    expect(unfoldIcsLines(ics).join("\n")).toContain(REMINDER_DESCRIPTION_PROMPT);
    expect(unfoldIcsLines(ics).join("\n")).toContain(APP_URL);
    expect(ics).toContain(`URL:${APP_URL}\r\n`);
  });

  it("escapes commas, semicolons, and backslashes in text values", () => {
    const escaped = generateReminderIcs({
      planStartDate: PLAN_START_DATE,
      appUrl: "https://example.com/a,b?c=d&e=f",
      now: NOW,
    });
    // Commas and semicolons in TEXT values are backslash-escaped (RFC 5545).
    expect(escaped).toContain("SUMMARY:Cohere preparation check-in\r\n");
    const summaryLine = unfoldIcsLines(escaped).find((l) => l.startsWith("DESCRIPTION:"));
    expect(summaryLine).toBeDefined();
    expect(summaryLine).not.toMatch(/[^\\],/);
    expect(summaryLine).not.toMatch(/[^\\];/);
  });

  it("uses CRLF line endings and folds lines at 75 octets", () => {
    expect(ics.includes("\n")).toBe(true); // CRLF contains \n
    expect(/(?<!\r)\n/.test(ics)).toBe(false); // every \n is preceded by \r
    for (const line of ics.split("\r\n")) {
      expect(line.length).toBeLessThanOrEqual(75);
    }
  });

  it("unfolds to the original logical lines", () => {
    const unfolded = unfoldIcsLines(ics);
    expect(unfolded.some((l) => l.startsWith("UID:"))).toBe(true);
    expect(unfolded.some((l) => l.startsWith("DESCRIPTION:") && l.length > 75)).toBe(true);
  });

  it("contains no private progress data", () => {
    // The generic spec-mandated prompt mentions "tasks" generically; the
    // event must not contain names, work products, or plan specifics.
    const forbidden = ["mohammed", "saidul", "resume", "evalops", "dashboardqa", "vector"];
    const lowered = unfoldIcsLines(ics).join("\n").toLowerCase();
    for (const term of forbidden) {
      expect(lowered).not.toContain(term);
    }
  });

  it("rejects invalid plan start dates before download", () => {
    expect(() =>
      generateReminderIcs({ planStartDate: "2026-13-40", appUrl: APP_URL, now: NOW }),
    ).toThrow(/plan start date/i);
    expect(() => generateReminderIcs({ planStartDate: "", appUrl: APP_URL, now: NOW })).toThrow(
      /plan start date/i,
    );
  });

  it("rejects non-HTTPS app URLs", () => {
    expect(() =>
      generateReminderIcs({
        planStartDate: PLAN_START_DATE,
        appUrl: "http://insecure.example/#/today",
        now: NOW,
      }),
    ).toThrow(/https/i);
  });
});
