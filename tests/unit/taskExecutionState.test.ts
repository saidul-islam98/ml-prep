import { describe, expect, it } from "vitest";
import {
  elapsedSeconds,
  emptyTaskExecution,
  pauseExecution,
} from "../../src/hooks/useTaskExecution";

describe("task execution state", () => {
  it("starts with serializable cross-device fields", () => {
    expect(emptyTaskExecution()).toEqual({
      completed_todo_ids: [],
      completed_criterion_ids: [],
      opened_resource_ids: [],
      current_step_index: 0,
      elapsed_seconds: 0,
      timer_started_at: null,
      step_notes: {},
      reflection_note: null,
      started_at: null,
      paused_at: null,
    });
  });

  it("accumulates a running focus timer and pauses without losing prior time", () => {
    const progress = {
      ...emptyTaskExecution(),
      elapsed_seconds: 90,
      timer_started_at: "2026-08-30T20:00:00.000Z",
    };
    expect(elapsedSeconds(progress, Date.parse("2026-08-30T20:02:00.000Z"))).toBe(210);
    expect(pauseExecution(progress, new Date("2026-08-30T20:02:00.000Z"))).toEqual({
      ...progress,
      elapsed_seconds: 210,
      timer_started_at: null,
      paused_at: "2026-08-30T20:02:00.000Z",
    });
  });
});
