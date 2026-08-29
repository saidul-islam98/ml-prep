import { describe, expect, it } from "vitest";
import { buildGoogleCalendarUrl } from "../src/reminder/googleCalendar";
import { REMINDER_TITLE } from "../src/reminder/ical";

const PLAN_START_DATE = "2026-08-31";
const APP_URL = "https://example.github.io/ml-prep/#/today";

describe("buildGoogleCalendarUrl", () => {
  const url = new URL(buildGoogleCalendarUrl({ planStartDate: PLAN_START_DATE, appUrl: APP_URL }));

  it("targets the Google Calendar event-template endpoint", () => {
    expect(url.origin).toBe("https://calendar.google.com");
    expect(url.pathname).toBe("/calendar/render");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
  });

  it("uses the generic reminder title", () => {
    expect(url.searchParams.get("text")).toBe(REMINDER_TITLE);
  });

  it("starts at 5:00 PM Toronto time on the plan start date for 15 minutes", () => {
    expect(url.searchParams.get("dates")).toBe("20260831T170000/20260831T171500");
    expect(url.searchParams.get("ctz")).toBe("America/Toronto");
  });

  it("recurs daily", () => {
    expect(url.searchParams.get("recur")).toBe("RRULE:FREQ=DAILY");
  });

  it("includes the generic prompt and app URL in the description", () => {
    const details = url.searchParams.get("details") ?? "";
    expect(details).toContain(APP_URL);
    expect(details).toContain("review and complete today's tasks");
  });

  it("escapes special characters safely in query parameters", () => {
    const tricky = buildGoogleCalendarUrl({
      planStartDate: PLAN_START_DATE,
      appUrl: "https://example.com/x?a=1&b=2",
    });
    expect(tricky).not.toMatch(/[^\x20-\x7E]/); // fully percent-encoded, ASCII-safe
    const parsed = new URL(tricky);
    expect(parsed.searchParams.get("details")).toContain("https://example.com/x?a=1&b=2");
  });

  it("contains no private progress data", () => {
    const lowered = url.toString().toLowerCase();
    for (const term of ["mohammed", "resume", "eval", "task:"]) {
      expect(lowered).not.toContain(term);
    }
  });

  it("rejects invalid inputs", () => {
    expect(() => buildGoogleCalendarUrl({ planStartDate: "not-a-date", appUrl: APP_URL })).toThrow(
      /plan start date/i,
    );
    expect(() =>
      buildGoogleCalendarUrl({
        planStartDate: PLAN_START_DATE,
        appUrl: "http://insecure.example/",
      }),
    ).toThrow(/https/i);
  });
});
