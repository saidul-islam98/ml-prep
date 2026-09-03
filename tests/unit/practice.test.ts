/**
 * Latest-ten qualifying coding sessions (WEBAPP_SPEC.md section 17): the
 * readiness calculation uses the latest ten qualifying tasks, not lifetime
 * volume. Qualifying = completed coding sessions with a recorded result,
 * ordered newest completion first; mocks, skipped/abandoned sessions, and
 * sessions without a recorded result are excluded.
 */

import { describe, expect, it } from "vitest";
import {
  codingGateSummary,
  codingPracticeTopic,
  codingProblemIdFromTopic,
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
    notes: "Reviewed approach, complexity, and edge cases.",
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

  it("excludes completed attempts that have not been reviewed", () => {
    const sessions = [
      session({ id: "no-notes", notes: null }),
      session({ id: "blank-notes", notes: "   " }),
      session({ id: "reviewed" }),
    ];
    expect(latestTenQualifyingCodingSessions(sessions).map((s) => s.id)).toEqual(["reviewed"]);
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

describe("codingGateSummary", () => {
  it("counts only independently solved sessions, not solved-with-help", () => {
    const latest = [
      ...Array.from({ length: 7 }, (_, i) => session({ id: `solved-${i}`, result: "solved" })),
      session({ id: "helped", result: "solved with help" }),
      session({ id: "unsolved", result: "unsolved" }),
      session({ id: "case", result: " SOLVED " }),
    ];
    expect(codingGateSummary(latest)).toEqual({ solved: 8, total: 10, meetsGate: true });
  });
});

describe("bookmarked coding problem identity", () => {
  it("round-trips a stable problem id through a persisted practice-session topic", () => {
    const topic = codingPracticeTopic({ id: "lc-3sum", title: "3Sum" });
    expect(topic).toBe("3Sum [lc-3sum]");
    expect(codingProblemIdFromTopic(topic)).toBe("lc-3sum");
    expect(codingProblemIdFromTopic("Custom graph exercise")).toBeNull();
  });
});
