import { describe, expect, it } from "vitest";
import {
  addDays,
  daysBetween,
  endOfDayInstant,
  formatDisplayDate,
  isValidDateKey,
  torontoDate,
  torontoParts,
  torontoToday,
} from "../../src/lib/toronto";

describe("torontoDate", () => {
  it("keeps late-UTC instants on the same Toronto day (EDT, UTC-4)", () => {
    // Sep 1, 03:30 UTC = Aug 31, 23:30 Toronto.
    expect(torontoDate(new Date("2026-09-01T03:30:00Z"))).toBe("2026-08-31");
  });

  it("handles the winter offset (EST, UTC-5)", () => {
    // Jan 15, 04:00 UTC = Jan 14, 23:00 Toronto.
    expect(torontoDate(new Date("2026-01-15T04:00:00Z"))).toBe("2026-01-14");
  });

  it("rolls over exactly at Toronto midnight", () => {
    // Midnight Toronto on Sep 1 EDT = 04:00 UTC.
    expect(torontoDate(new Date("2026-09-01T04:00:00Z"))).toBe("2026-09-01");
    // One second before midnight belongs to Aug 31.
    expect(torontoDate(new Date("2026-09-01T03:59:59Z"))).toBe("2026-08-31");
  });

  it("keeps midnight correctness across the DST fall-back boundary", () => {
    // Nov 1, 2026: midnight is EDT (-4) = 04:00 UTC; the repeated hour falls
    // at 06:00Z (2 AM EDT -> 1 AM EST).
    expect(torontoDate(new Date("2026-11-01T04:00:00Z"))).toBe("2026-11-01");
    expect(torontoDate(new Date("2026-11-01T03:59:59Z"))).toBe("2026-10-31");
  });

  it("keeps midnight correctness across the DST spring-forward boundary", () => {
    // Mar 8, 2026: 2 AM EST jumps to 3 AM EDT, so midnight is still EST (-5):
    // midnight Toronto = 05:00 UTC.
    expect(torontoDate(new Date("2026-03-08T05:00:00Z"))).toBe("2026-03-08");
    expect(torontoDate(new Date("2026-03-08T04:59:59Z"))).toBe("2026-03-07");
  });
});

describe("torontoParts", () => {
  it("returns 24h wall-clock parts", () => {
    const p = torontoParts(new Date("2026-09-01T15:30:45Z"));
    // 15:30 UTC = 11:30 Toronto (EDT).
    expect(p).toMatchObject({ hour: 11, minute: 30, second: 45 });
  });
});

describe("torontoToday", () => {
  it("uses the passed instant", () => {
    expect(torontoToday(new Date("2026-08-31T12:00:00Z"))).toBe("2026-08-31");
  });
});

describe("isValidDateKey", () => {
  it("rejects malformed or impossible dates", () => {
    expect(isValidDateKey("2026-08-31")).toBe(true);
    expect(isValidDateKey("2026-02-30")).toBe(false);
    expect(isValidDateKey("2026-13-01")).toBe(false);
    expect(isValidDateKey("20260831")).toBe(false);
    expect(isValidDateKey("")).toBe(false);
  });
});

describe("addDays / daysBetween", () => {
  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-09-01", -1)).toBe("2026-08-31");
  });

  it("computes whole-day differences", () => {
    expect(daysBetween("2026-08-31", "2026-09-06")).toBe(6);
    expect(daysBetween("2026-09-06", "2026-08-31")).toBe(-6);
  });
});

describe("endOfDayInstant", () => {
  it("is the last millisecond of the Toronto day (EDT)", () => {
    const end = endOfDayInstant("2026-08-31");
    expect(torontoDate(end)).toBe("2026-08-31");
    expect(torontoParts(end)).toMatchObject({ hour: 23, minute: 59, second: 59 });
  });

  it("is the last millisecond of the Toronto day (EST)", () => {
    const end = endOfDayInstant("2026-12-06");
    expect(torontoDate(end)).toBe("2026-12-06");
    expect(torontoParts(end)).toMatchObject({ hour: 23, minute: 59, second: 59 });
  });

  it("classifies completion instants against deadlines across DST", () => {
    // Completed 23:59 Toronto on the deadline day (EDT): on time.
    expect(torontoDate(new Date("2026-09-06T03:59:00Z"))).toBe("2026-09-05");
    // Completed 00:01 Toronto the next day: past the deadline.
    expect(torontoDate(new Date("2026-09-06T04:01:00Z"))).toBe("2026-09-06");
  });
});

describe("formatDisplayDate", () => {
  it("renders a weekday label", () => {
    expect(formatDisplayDate("2026-08-31")).toBe("Mon, Aug 31");
  });
});
