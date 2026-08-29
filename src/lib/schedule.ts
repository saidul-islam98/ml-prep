/**
 * Schedule classification and overdue derivation (WEBAPP_SPEC.md section 8.1).
 * Pure functions over task rows and task events; the executable truth source
 * for metric-adjacent behavior (the full metric fixtures land in Task 14).
 */

import { endOfDayInstant, torontoDate } from "./toronto";

export type TaskState = "not_started" | "in_progress" | "completed" | "skipped" | "archived";

export interface TaskLike {
  id: string;
  state: TaskState;
  original_scheduled_date: string;
  scheduled_date: string;
  estimated_minutes: number;
  template_task_key: string | null;
  role_tags: string[];
  category: string;
  /** Client-side marker for the optional Post-Training track. */
  optionalTrack?: boolean;
  completed_at: string | null;
  skip_reason: string | null;
}

export interface EventLike {
  event_type: string;
  from_scheduled_date?: string | null;
  to_scheduled_date?: string | null;
  occurred_at: string;
}

export type ScheduleClassification =
  "completed_on_original_schedule" | "completed_after_proactive_reschedule" | "completed_late";

const OPEN_STATES: TaskState[] = ["not_started", "in_progress"];

/**
 * Overdue = current scheduled date before today (Toronto) and resolution is
 * open. Completed, skipped, and archived tasks are never overdue.
 */
export function deriveOverdue<T extends TaskLike>(tasks: T[], todayToronto: string): T[] {
  return tasks.filter((t) => OPEN_STATES.includes(t.state) && t.scheduled_date < todayToronto);
}

/** Number of reschedules recorded for a task. */
export function rescheduleCount(events: EventLike[]): number {
  return events.filter((e) => e.event_type === "rescheduled").length;
}

/**
 * Classify a completed task's schedule fidelity, or null when it is not
 * completed. Events must be the task's full event history.
 */
export function classifyCompletion(
  task: TaskLike,
  events: EventLike[],
  _todayToronto: string,
): ScheduleClassification | null {
  if (task.state !== "completed" || !task.completed_at) return null;

  const reschedules = events
    .filter((e) => e.event_type === "rescheduled")
    .sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));

  // Reconstruct the deadline sequence and whether any deadline was missed
  // (a reschedule issued after the then-current deadline had passed).
  let currentDeadline = task.original_scheduled_date;
  let missedDeadline = false;
  for (const event of reschedules) {
    const deadlineEnd = endOfDayInstant(currentDeadline).getTime();
    if (Date.parse(event.occurred_at) > deadlineEnd) {
      missedDeadline = true;
    }
    currentDeadline = event.to_scheduled_date ?? currentDeadline;
  }

  const completedAt = Date.parse(task.completed_at);
  const currentDeadlineEnd = endOfDayInstant(currentDeadline).getTime();
  if (completedAt > currentDeadlineEnd) {
    return "completed_late";
  }
  if (missedDeadline) {
    return "completed_late";
  }
  if (reschedules.length > 0) {
    return "completed_after_proactive_reschedule";
  }
  return "completed_on_original_schedule";
}

/** The Toronto date on which a completion happened (for actual-effort). */
export function completionDate(task: TaskLike): string | null {
  if (task.state !== "completed" || !task.completed_at) return null;
  return torontoDate(new Date(task.completed_at));
}
