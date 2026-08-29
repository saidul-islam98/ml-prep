/**
 * Latest-ten qualifying coding sessions (WEBAPP_SPEC.md section 17): the
 * readiness calculation uses the latest ten qualifying tasks, not lifetime
 * volume. Qualifying = completed coding sessions with a recorded result,
 * ordered newest completion first; mocks, skipped/abandoned sessions, and
 * sessions without a recorded result are excluded.
 */

import { describe, expect, it } from "vitest";
import {
  latestTenQualifyingCodingSessions,
  type PracticeSessionLike,
} from "../../src/lib/practice";

function session(overrides: Partial<PracticeSessionLike> = {}): PracticeSessionLike {
  return {
    id: "s1",
    session_type: "coding",
    state: "completed",
    result: "solved",
    completed_at: "2026-09-01T10:00:00Z",
    ...overrides,
  };
}

describe("latestTenQualifyingCodingSessions", () => {
  it("returns at most ten sessions, newest completion first", () => {
    const sessions = Array.from({ length: 14 }, (_, i) =>
      session({ id: `s${i}`, completed_at: new Date(Date.UTC(2026, 8, 1 + i)).toISOString() }),
    );
    const latest = latestTenQualifyingCodingSessions(sessions);
    expect(latest).toHaveLength(10);
    expect(latest[0].id).toBe("s13");
    expect(latest[9].id).toBe("s4");
  });

  it("excludes mocks even when completed with a result", () => {
    const sessions = [
      session({ id: "mock", session_type: "mock" }),
      session({ id: "coding", session_type: "coding" }),
    ];
    const latest = latestTenQualifyingCodingSessions(sessions);
    expect(latest.map((s) => s.id)).toEqual(["coding"]);
  });

  it("excludes abandoned and skipped sessions", () => {
    const sessions = [
      session({ id: "abandoned", state: "abandoned" }),
      session({ id: "skipped", state: "skipped" }),
      session({ id: "planned", state: "planned" }),
      session({ id: "in-progress", state: "in_progress" }),
      session({ id: "ok" }),
    ];
    const latest = latestTenQualifyingCodingSessions(sessions);
    expect(latest.map((s) => s.id)).toEqual(["ok"]);
  });

  it("excludes sessions without a recorded result", () => {
    const sessions = [
      session({ id: "no-result", result: null }),
      session({ id: "empty-result", result: "  " }),
      session({ id: "ok", result: "solved with help" }),
    ];
    const latest = latestTenQualifyingCodingSessions(sessions);
    expect(latest.map((s) => s.id)).toEqual(["ok"]);
  });

  it("orders by completion timestamp, not creation or date field", () => {
    const sessions = [
      session({ id: "early", completed_at: "2026-09-01T08:00:00Z" }),
      session({ id: "late", completed_at: "2026-09-01T20:00:00Z" }),
    ];
    const latest = latestTenQualifyingCodingSessions(sessions);
    expect(latest.map((s) => s.id)).toEqual(["late", "early"]);
  });

  it("handles sessions missing completed_at defensively", () => {
    const sessions = [session({ id: "no-timestamp", completed_at: null }), session({ id: "ok" })];
    const latest = latestTenQualifyingCodingSessions(sessions);
    expect(latest.map((s) => s.id)).toEqual(["ok"]);
  });

  it("returns an empty list when nothing qualifies", () => {
    expect(latestTenQualifyingCodingSessions([])).toEqual([]);
    expect(latestTenQualifyingCodingSessions([session({ state: "abandoned" })])).toEqual([]);
  });
});
