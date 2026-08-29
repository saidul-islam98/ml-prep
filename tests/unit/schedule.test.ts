/**
 * Schedule classification and overdue derivation (WEBAPP_SPEC.md section 8.1).
 *
 * Resolution and timeliness are separate dimensions. Completion classes:
 *  - completed_on_original_schedule: completed by end of the original
 *    Toronto day, never rescheduled (or only forward without missing).
 *  - completed_after_proactive_reschedule: every reschedule happened before
 *    the then-current deadline had passed, and completion met the last one.
 *  - completed_late: any scheduled deadline had already passed before
 *    completion (including overdue reschedules).
 */

import { describe, expect, it } from "vitest";
import {
  deriveOverdue,
  classifyCompletion,
  rescheduleCount,
  type EventLike,
  type TaskLike,
} from "../../src/lib/schedule";

function task(overrides: Partial<TaskLike> = {}): TaskLike {
  return {
    id: "t1",
    state: "not_started",
    original_scheduled_date: "2026-09-01",
    scheduled_date: "2026-09-01",
    estimated_minutes: 60,
    template_task_key: "w01-tue",
    role_tags: ["data_eval"],
    category: "deep_work",
    optionalTrack: false,
    completed_at: null,
    skip_reason: null,
    ...overrides,
  };
}

function rescheduleEvent(from: string, to: string, occurredAtIso: string): EventLike {
  return {
    event_type: "rescheduled",
    from_scheduled_date: from,
    to_scheduled_date: to,
    occurred_at: occurredAtIso,
  };
}

const COMPLETED = "completed" as const;

describe("deriveOverdue", () => {
  it("marks open tasks whose current scheduled date is before today", () => {
    const tasks = [
      task({ id: "t1", state: "not_started", scheduled_date: "2026-08-31" }),
      task({ id: "t2", state: "in_progress", scheduled_date: "2026-08-31" }),
      task({
        id: "t3",
        state: "completed",
        scheduled_date: "2026-08-31",
        completed_at: "2026-09-02T20:00:00Z",
      }),
      task({ id: "t4", state: "skipped", scheduled_date: "2026-08-31", skip_reason: "no" }),
      task({ id: "t5", state: "not_started", scheduled_date: "2026-09-01" }),
      task({ id: "t6", state: "archived", scheduled_date: "2026-08-30" }),
    ];
    const overdue = deriveOverdue(tasks, "2026-09-01");
    expect(overdue.map((t) => t.id)).toEqual(["t1", "t2"]);
  });

  it("uses strict date comparison: today is not overdue", () => {
    const tasks = [task({ scheduled_date: "2026-09-01" })];
    expect(deriveOverdue(tasks, "2026-09-01")).toHaveLength(0);
  });
});

describe("rescheduleCount", () => {
  it("counts rescheduled events only", () => {
    const events: EventLike[] = [
      { event_type: "created", occurred_at: "2026-08-31T00:00:00Z" },
      rescheduleEvent("2026-09-01", "2026-09-03", "2026-09-01T10:00:00Z"),
      rescheduleEvent("2026-09-03", "2026-09-05", "2026-09-03T10:00:00Z"),
      { event_type: "started", occurred_at: "2026-09-05T10:00:00Z" },
    ];
    expect(rescheduleCount(events)).toBe(2);
    expect(rescheduleCount([])).toBe(0);
  });
});

describe("classifyCompletion", () => {
  const deadline = "2026-09-01";

  it("completed within the original Toronto day: on original schedule", () => {
    const t = task({
      state: COMPLETED,
      completed_at: "2026-09-02T03:30:00Z", // Sep 1, 23:30 Toronto (EDT)
    });
    expect(classifyCompletion(t, [], "2026-09-10")).toBe("completed_on_original_schedule");
  });

  it("completed the next Toronto day without reschedule: late", () => {
    const t = task({
      state: COMPLETED,
      completed_at: "2026-09-02T04:01:00Z", // Sep 2, 00:01 Toronto
    });
    expect(classifyCompletion(t, [], "2026-09-10")).toBe("completed_late");
  });

  it("proactive reschedule (before deadline) completed by the new deadline", () => {
    const t = task({
      state: COMPLETED,
      scheduled_date: "2026-09-03",
      completed_at: "2026-09-04T02:00:00Z", // Sep 3, 22:00 Toronto
    });
    const events = [rescheduleEvent(deadline, "2026-09-03", "2026-09-01T12:00:00Z")];
    expect(classifyCompletion(t, events, "2026-09-10")).toBe(
      "completed_after_proactive_reschedule",
    );
  });

  it("overdue reschedule (after deadline passed) makes completion late", () => {
    const t = task({
      state: COMPLETED,
      scheduled_date: "2026-09-05",
      completed_at: "2026-09-06T02:00:00Z", // Sep 5, 22:00 Toronto
    });
    const events = [
      rescheduleEvent(deadline, "2026-09-05", "2026-09-03T12:00:00Z"), // after Sep 1 ended
    ];
    expect(classifyCompletion(t, events, "2026-09-10")).toBe("completed_late");
  });

  it("multiple proactive reschedules stay proactive when deadlines are met", () => {
    const t = task({
      state: COMPLETED,
      scheduled_date: "2026-09-08",
      completed_at: "2026-09-09T00:30:00Z", // Sep 8, 20:30 Toronto
    });
    const events = [
      rescheduleEvent(deadline, "2026-09-03", "2026-09-01T12:00:00Z"),
      rescheduleEvent("2026-09-03", "2026-09-08", "2026-09-02T12:00:00Z"),
    ];
    expect(classifyCompletion(t, events, "2026-09-10")).toBe(
      "completed_after_proactive_reschedule",
    );
  });

  it("completing past the proactively rescheduled deadline is late", () => {
    const t = task({
      state: COMPLETED,
      scheduled_date: "2026-09-03",
      completed_at: "2026-09-05T02:00:00Z", // Sep 4 Toronto: past Sep 3 deadline
    });
    const events = [rescheduleEvent(deadline, "2026-09-03", "2026-09-01T12:00:00Z")];
    expect(classifyCompletion(t, events, "2026-09-10")).toBe("completed_late");
  });

  it("multiple reschedules where one happened after its deadline: late", () => {
    const t = task({
      state: COMPLETED,
      scheduled_date: "2026-09-10",
      completed_at: "2026-09-11T02:00:00Z",
    });
    const events = [
      rescheduleEvent(deadline, "2026-09-03", "2026-09-01T12:00:00Z"), // proactive
      rescheduleEvent("2026-09-03", "2026-09-10", "2026-09-04T12:00:00Z"), // after Sep 3 ended
    ];
    expect(classifyCompletion(t, events, "2026-09-15")).toBe("completed_late");
  });

  it("reschedule recorded at the boundary instant of the deadline day is proactive", () => {
    const t = task({
      state: COMPLETED,
      scheduled_date: "2026-09-03",
      completed_at: "2026-09-04T02:00:00Z",
    });
    // Rescheduled at 23:59:59.999 Toronto on Sep 1 = Sep 2 03:59:59.999Z EDT.
    const events = [rescheduleEvent(deadline, "2026-09-03", "2026-09-02T03:59:59Z")];
    expect(classifyCompletion(t, events, "2026-09-10")).toBe(
      "completed_after_proactive_reschedule",
    );
  });

  it("ignores non-reschedule events entirely", () => {
    const t = task({
      state: COMPLETED,
      completed_at: "2026-09-02T03:30:00Z",
    });
    const events: EventLike[] = [
      { event_type: "created", occurred_at: "2026-08-31T00:00:00Z" },
      { event_type: "started", occurred_at: "2026-09-01T10:00:00Z" },
      { event_type: "completed", occurred_at: "2026-09-02T03:30:00Z" },
    ];
    expect(classifyCompletion(t, events, "2026-09-10")).toBe("completed_on_original_schedule");
  });

  it("open tasks have no completion classification", () => {
    expect(classifyCompletion(task(), [], "2026-09-10")).toBeNull();
    expect(
      classifyCompletion(task({ state: "skipped", skip_reason: "x" }), [], "2026-09-10"),
    ).toBeNull();
  });
});
