import { describe, expect, it } from "vitest";
import { CLOCK_SKEW_THRESHOLD_MS, fetchClockCheck, formatSkew } from "../../src/lib/clock";

function respondWithDate(dateHeader: string): typeof fetch {
  return (async () =>
    new Response(null, { headers: { date: dateHeader } })) as unknown as typeof fetch;
}

describe("fetchClockCheck", () => {
  it("reports the delta between server and client clocks", async () => {
    const server = new Date("2026-09-01T12:00:00Z");
    const realNow = Date.now;
    Date.now = () => Date.parse("2026-09-01T12:04:00Z");
    try {
      const check = await fetchClockCheck(
        "https://example.supabase.co",
        respondWithDate(server.toUTCString()),
      );
      expect(check?.deltaMs).toBe(-4 * 60 * 1000);
      expect(check?.exceedsThreshold).toBe(false);
    } finally {
      Date.now = realNow;
    }
  });

  it("flags deltas beyond the five-minute threshold in both directions", async () => {
    const realNow = Date.now;
    Date.now = () => Date.parse("2026-09-01T12:00:00Z");
    try {
      const ahead = await fetchClockCheck(
        "https://example.supabase.co",
        respondWithDate(new Date(Date.parse("2026-09-01T12:06:00Z")).toUTCString()),
      );
      expect(ahead?.exceedsThreshold).toBe(true);
      const behind = await fetchClockCheck(
        "https://example.supabase.co",
        respondWithDate(new Date(Date.parse("2026-09-01T11:45:00Z")).toUTCString()),
      );
      expect(behind?.exceedsThreshold).toBe(true);
      const atThreshold = await fetchClockCheck(
        "https://example.supabase.co",
        respondWithDate(new Date(Date.parse("2026-09-01T12:05:00Z")).toUTCString()),
      );
      expect(atThreshold?.exceedsThreshold).toBe(false); // exactly 5 min is not "over"
    } finally {
      Date.now = realNow;
    }
  });

  it("threshold is five minutes", () => {
    expect(CLOCK_SKEW_THRESHOLD_MS).toBe(300_000);
  });

  it("returns null instead of throwing when the network fails", async () => {
    const failing = (async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;
    expect(await fetchClockCheck("https://example.supabase.co", failing)).toBeNull();
  });
});

describe("formatSkew", () => {
  it("formats minute-granularity skew", () => {
    expect(formatSkew(120_000)).toBe("2 minutes");
    expect(formatSkew(-60_000)).toBe("1 minute");
  });
});
