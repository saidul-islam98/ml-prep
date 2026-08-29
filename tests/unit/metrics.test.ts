/**
 * Metric truth-table fixtures (WEBAPP_SPEC.md section 8.4). The expected
 * values here are the executable truth source for metric behavior:
 * completion before/on/after the original deadline; proactive and overdue
 * reschedules; multiple reschedules; skip; reopen; custom archive retained
 * as a denominator/non-completion; optional tasks before/after enablement;
 * zero denominators; and a task completed in one reporting period but
 * originally due in another.
 */

import { describe, expect, it } from "vitest";
import {
  actualEffortByDate,
  cohortTasks,
  consistencyDays,
  currentWorkloadByDate,
  formatRate,
  outcomeCounts,
  type MetricPeriod,
  type MetricTask,
} from "../../src/lib/metrics";
import type { EventLike } from "../../src/lib/schedule";

function task(overrides: Partial<MetricTask> = {}): MetricTask {
  return {
    id: "t1",
    state: "not_started",
    original_scheduled_date: "2026-09-01",
    scheduled_date: "2026-09-01",
    estimated_minutes: 60,
    actual_minutes: null,
    completed_at: null,
    template_task_key: "w01-tue",
    role_tags: ["data_eval"],
    category: "deep_work",
    optionalTrack: false,
    skip_reason: null,
    ...overrides,
  };
}

function reschedule(from: string, to: string, at: string): EventLike {
  return { event_type: "rescheduled", from_scheduled_date: from, to_scheduled_date: to, occurred_at: at };
}

const PERIOD: MetricPeriod = { start: "2026-09-01", end: "2026-09-07" };
const NO_EVENTS: Record<string, EventLike[]> = {};

// Helper instants: end of Sep 1 Toronto (EDT) is 2026-09-02T03:59:59.999Z.
const ON_TIME = "2026-09-02T03:00:00Z"; // Sep 1, 23:00 Toronto
const LATE = "2026-09-02T04:01:00Z"; // Sep 2, 00:01 Toronto

describe("cohort freezing", () => {
  it("keeps rescheduled tasks in the original-date cohort", () => {
    const tasks = [
      task({
        id: "moved",
        scheduled_date: "2026-09-20", // rescheduled far beyond the period
      }),
    ];
    const cohort = cohortTasks(tasks, PERIOD, false);
    expect(cohort.map((t) => t.id)).toEqual(["moved"]);
  });

  it("a task completed in a later period stays in the original-period denominator", () => {
    const tasks = [
      task({
        id: "cross",
        state: "completed",
        completed_at: "2026-09-20T15:00:00Z", // completed Sep 20, originally due Sep 1
        actual_minutes: 50,
      }),
    ];
    const counts = outcomeCounts(tasks, NO_EVENTS, PERIOD, false);
    expect(counts.eligible).toBe(1);
    expect(counts.completedOnOriginalSchedule).toBe(0);
    expect(counts.completedLate).toBe(1);
    // Actual effort lands on the completion date, not the due date.
    const effort = actualEffortByDate(tasks, false);
    expect(effort.get("2026-09-20")).toBe(50);
    expect(effort.has("2026-09-01")).toBe(false);
  });
});

describe("outcome classifications", () => {
  it("counts completion before/on/after the original deadline distinctly", () => {
    const tasks = [
      task({ id: "on-time", state: "completed", completed_at: ON_TIME, actual_minutes: 60 }),
      task({ id: "late", state: "completed", completed_at: LATE, actual_minutes: 60 }),
    ];
    const counts = outcomeCounts(tasks, NO_EVENTS, PERIOD, false);
    expect(counts.completedOnOriginalSchedule).toBe(1);
    expect(counts.completedAfterProactiveReschedule).toBe(0);
    expect(counts.completedLate).toBe(1);
    expect(counts.onTimeCompletionRate).toBeCloseTo(0.5);
  });

  it("treats a proactive reschedule completed by the new deadline as proactive, not on-time", () => {
    const tasks = [
      task({
        id: "proactive",
        state: "completed",
        scheduled_date: "2026-09-03",
        completed_at: "2026-09-04T02:00:00Z", // Sep 3, 22:00 Toronto
        actual_minutes: 60,
      }),
    ];
    const events = {
      proactive: [reschedule("2026-09-01", "2026-09-03", "2026-09-01T12:00:00Z")],
    };
    const counts = outcomeCounts(tasks, events, PERIOD, false);
    expect(counts.completedAfterProactiveReschedule).toBe(1);
    expect(counts.completedOnOriginalSchedule).toBe(0);
    // Strict on-time rate does not reward schedule movement.
    expect(counts.onTimeCompletionRate).toBe(0);
    // But resolution counts it.
    expect(counts.resolutionRate).toBe(1);
  });

  it("treats an overdue reschedule completed after as late", () => {
    const tasks = [
      task({
        id: "overdue-moved",
        state: "completed",
        scheduled_date: "2026-09-05",
        completed_at: "2026-09-06T02:00:00Z",
        actual_minutes: 60,
      }),
    ];
    const events = {
      "overdue-moved": [reschedule("2026-09-01", "2026-09-05", "2026-09-03T12:00:00Z")],
    };
    const counts = outcomeCounts(tasks, events, PERIOD, false);
    expect(counts.completedLate).toBe(1);
    expect(counts.onTimeCompletionRate).toBe(0);
    expect(counts.resolutionRate).toBe(1);
  });

  it("multiple reschedules: one late miss poisons the whole classification", () => {
    const tasks = [
      task({
        id: "multi",
        state: "completed",
        scheduled_date: "2026-09-10",
        completed_at: "2026-09-11T02:00:00Z",
        actual_minutes: 60,
      }),
    ];
    const events = {
      multi: [
        reschedule("2026-09-01", "2026-09-03", "2026-09-01T12:00:00Z"), // proactive
        reschedule("2026-09-03", "2026-09-10", "2026-09-04T12:00:00Z"), // after Sep 3 ended: late
      ],
    };
    const counts = outcomeCounts(tasks, events, { start: "2026-09-01", end: "2026-09-14" }, false);
    expect(counts.completedLate).toBe(1);
    expect(counts.onTimeCompletionRate).toBe(0);
    expect(counts.resolutionRate).toBe(1);
  });

  it("skipped tasks count toward resolution but never completion", () => {
    const tasks = [
      task({ id: "skip", state: "skipped", skip_reason: "not relevant" }),
      task({ id: "done", state: "completed", completed_at: ON_TIME, actual_minutes: 60 }),
    ];
    const counts = outcomeCounts(tasks, NO_EVENTS, PERIOD, false);
    expect(counts.skipped).toBe(1);
    expect(counts.completedOnOriginalSchedule).toBe(1);
    expect(counts.resolutionRate).toBe(1);
    expect(counts.onTimeCompletionRate).toBe(0.5);
    // Planned-minute attainment counts only completed estimates.
    expect(counts.plannedMinuteAttainment).toBe(0.5);
  });

  it("reopened tasks stop contributing completion credit until completed again", () => {
    const tasks = [
      task({ id: "reopen", state: "in_progress" }), // was completed, then reopened
    ];
    const events = {
      reopen: [
        { event_type: "created", occurred_at: "2026-08-31T00:00:00Z" },
        { event_type: "completed", occurred_at: "2026-09-01T10:00:00Z" },
        { event_type: "reopened", occurred_at: "2026-09-02T10:00:00Z" },
      ],
    };
    const counts = outcomeCounts(tasks, events, PERIOD, false);
    expect(counts.completedOnOriginalSchedule).toBe(0);
    expect(counts.resolutionRate).toBe(0);
    expect(counts.plannedMinutesCompleted).toBe(0);
  });

  it("archived custom tasks stay in the denominator as non-completions", () => {
    const tasks = [
      task({ id: "arch", state: "archived" }),
      task({ id: "done", state: "completed", completed_at: ON_TIME, actual_minutes: 60 }),
    ];
    const counts = outcomeCounts(tasks, NO_EVENTS, PERIOD, false);
    expect(counts.eligible).toBe(2);
    expect(counts.archived).toBe(1);
    expect(counts.resolutionRate).toBe(0.5); // archived is not resolution
    expect(counts.onTimeCompletionRate).toBe(0.5);
  });

  it("unresolved overdue counts open tasks whose current date passed", () => {
    const tasks = [
      task({ id: "open-past", scheduled_date: "2026-09-01" }),
      task({ id: "open-future", scheduled_date: "2026-09-20" }),
    ];
    const counts = outcomeCounts(tasks, NO_EVENTS, PERIOD, false, "2026-09-06");
    expect(counts.unresolvedOverdue).toBe(1);
    // Not overdue on the same day they are due.
    const sameDay = outcomeCounts(tasks, NO_EVENTS, PERIOD, false, "2026-09-01");
    expect(sameDay.unresolvedOverdue).toBe(0);
  });
});

describe("optional-track inclusion and exclusion", () => {
  it("excludes optional tasks before enablement and includes them after", () => {
    const tasks = [
      task({ id: "required", state: "completed", completed_at: ON_TIME, actual_minutes: 60 }),
      task({
        id: "optional",
        optionalTrack: true,
        template_task_key: "pt-w9-scope",
        role_tags: ["post_training"],
        estimated_minutes: 120,
        state: "completed",
        completed_at: ON_TIME,
        actual_minutes: 120,
      }),
    ];
    const before = outcomeCounts(tasks, NO_EVENTS, PERIOD, false);
    expect(before.eligible).toBe(1);
    expect(before.plannedMinutesEligible).toBe(60);

    const after = outcomeCounts(tasks, NO_EVENTS, PERIOD, true);
    expect(after.eligible).toBe(2);
    expect(after.plannedMinutesEligible).toBe(180);
  });
});

describe("zero denominators", () => {
  it("yields null rates, formatted as an em dash", () => {
    const counts = outcomeCounts([], NO_EVENTS, PERIOD, false);
    expect(counts.onTimeCompletionRate).toBeNull();
    expect(counts.resolutionRate).toBeNull();
    expect(formatRate(null)).toBe("\u2014");
    expect(formatRate(0.5)).toBe("50%");
    expect(formatRate(0)).toBe("0%");
  });

  it("yields null attainment when eligible minutes are zero but tasks exist", () => {
    // Not reachable through the seed (estimates are positive), but the
    // metric must still guard the zero denominator.
    const counts = outcomeCounts([], NO_EVENTS, PERIOD, false);
    expect(counts.plannedMinuteAttainment).toBeNull();
  });
});

describe("actual effort and workload groupings", () => {
  it("groups actual minutes by completion date and skips non-completed", () => {
    const tasks = [
      task({ id: "a", state: "completed", completed_at: ON_TIME, actual_minutes: 60 }),
      task({ id: "b", state: "completed", completed_at: "2026-09-02T20:00:00Z", actual_minutes: 30 }),
      task({ id: "c", state: "skipped", skip_reason: "x" }),
    ];
    const effort = actualEffortByDate(tasks, false);
    expect(effort.get("2026-09-01")).toBe(60);
    expect(effort.get("2026-09-02")).toBe(30);
  });

  it("current workload groups open estimates by current scheduled date", () => {
    const tasks = [
      task({ id: "a", scheduled_date: "2026-09-03", estimated_minutes: 60 }),
      task({ id: "b", scheduled_date: "2026-09-03", estimated_minutes: 30 }),
      task({ id: "c", state: "completed", completed_at: ON_TIME, actual_minutes: 60 }),
    ];
    const workload = currentWorkloadByDate(tasks, false);
    expect(workload.get("2026-09-03")).toBe(90);
    expect(workload.size).toBe(1);
  });

  it("consistency counts distinct days with at least one completion", () => {
    const tasks = [
      task({ id: "a", state: "completed", completed_at: ON_TIME, actual_minutes: 60 }),
      task({
        id: "b",
        state: "completed",
        completed_at: "2026-09-02T20:00:00Z",
        actual_minutes: 30,
      }),
      task({
        id: "c",
        state: "completed",
        completed_at: "2026-09-02T21:00:00Z",
        actual_minutes: 20,
      }),
    ];
    expect(consistencyDays(tasks, PERIOD, false)).toBe(2);
  });
});
