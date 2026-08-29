/**
 * Progress metrics (WEBAPP_SPEC.md sections 8.2 and 8.4).
 *
 * Truth source for the executable fixtures: resolution and timeliness are
 * separate dimensions; cohorts freeze at the original scheduled date;
 * optional tasks are excluded until enabled; zero denominators yield null
 * (displayed as an em dash) rather than a fake 0% or 100%.
 */

import { torontoDate } from "./toronto";
import type { EventLike, ScheduleClassification, TaskLike } from "./schedule";
import { classifyCompletion, deriveOverdue } from "./schedule";

export interface MetricTask extends TaskLike {
  estimated_minutes: number;
  actual_minutes: number | null;
  completed_at: string | null;
}

function isOptionalTask(task: Pick<MetricTask, "role_tags">): boolean {
  return task.role_tags.includes("post_training");
}

export interface MetricPeriod {
  start: string; // "YYYY-MM-DD" inclusive
  end: string; // "YYYY-MM-DD" inclusive
}

export function inPeriod(date: string, period: MetricPeriod): boolean {
  return date >= period.start && date <= period.end;
}

/** Eligible cohort: tasks whose ORIGINAL scheduled date falls in the period. */
export function cohortTasks<T extends MetricTask>(
  tasks: T[],
  period: MetricPeriod,
  includeOptional: boolean,
): T[] {
  return tasks.filter(
    (t) => (includeOptional || !isOptionalTask(t)) && inPeriod(t.original_scheduled_date, period),
  );
}

export interface OutcomeCounts {
  eligible: number;
  completedOnOriginalSchedule: number;
  completedAfterProactiveReschedule: number;
  completedLate: number;
  skipped: number;
  archived: number;
  unresolvedOverdue: number;
  onTimeCompletionRate: number | null;
  resolutionRate: number | null;
  plannedMinuteAttainment: number | null;
  plannedMinutesEligible: number;
  plannedMinutesCompleted: number;
}

/**
 * Outcome counts for one period. Classification needs each task's event
 * history (reschedule timing drives proactive vs late).
 */
export function outcomeCounts(
  tasks: MetricTask[],
  eventsByTask: Record<string, EventLike[]>,
  period: MetricPeriod,
  includeOptional: boolean,
  todayToronto?: string,
): OutcomeCounts {
  const cohort = cohortTasks(tasks, period, includeOptional);
  const counts: OutcomeCounts = {
    eligible: cohort.length,
    completedOnOriginalSchedule: 0,
    completedAfterProactiveReschedule: 0,
    completedLate: 0,
    skipped: 0,
    archived: 0,
    unresolvedOverdue: 0,
    onTimeCompletionRate: null,
    resolutionRate: null,
    plannedMinuteAttainment: null,
    plannedMinutesEligible: 0,
    plannedMinutesCompleted: 0,
  };

  let completedTotal = 0;
  let skippedTotal = 0;

  for (const task of cohort) {
    counts.plannedMinutesEligible += task.estimated_minutes;
    if (task.state === "completed") {
      completedTotal += 1;
      counts.plannedMinutesCompleted += task.estimated_minutes;
      const classification = classifyCompletion(task, eventsByTask[task.id] ?? [], period.end);
      if (classification === "completed_on_original_schedule") {
        counts.completedOnOriginalSchedule += 1;
      } else if (classification === "completed_after_proactive_reschedule") {
        counts.completedAfterProactiveReschedule += 1;
      } else {
        counts.completedLate += 1;
      }
    } else if (task.state === "skipped") {
      skippedTotal += 1;
      counts.skipped += 1;
    } else if (task.state === "archived") {
      // Archived is a non-completion but stays in the denominator (8.2).
      counts.archived += 1;
    }
  }

  // Open tasks count as unresolved overdue when their CURRENT date passed.
  counts.unresolvedOverdue = deriveOverdue(cohort, todayToronto ?? torontoDate(new Date())).length;

  if (counts.eligible > 0) {
    counts.onTimeCompletionRate = counts.completedOnOriginalSchedule / counts.eligible;
    counts.resolutionRate = (completedTotal + skippedTotal) / counts.eligible;
    if (counts.plannedMinutesEligible > 0) {
      counts.plannedMinuteAttainment =
        counts.plannedMinutesCompleted / counts.plannedMinutesEligible;
    }
  }
  return counts;
}

/**
 * Actual effort: actual minutes grouped by the Toronto completion date, not
 * the due date. A task completed in another period appears there.
 */
export function actualEffortByDate(
  tasks: MetricTask[],
  includeOptional: boolean,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const task of tasks) {
    if (!includeOptional && isOptionalTask(task)) continue;
    if (task.state !== "completed" || !task.completed_at) continue;
    const date = torontoDate(new Date(task.completed_at));
    map.set(date, (map.get(date) ?? 0) + (task.actual_minutes ?? 0));
  }
  return map;
}

/**
 * Current workload: open estimated minutes grouped by CURRENT scheduled
 * date. Never labeled plan completion.
 */
export function currentWorkloadByDate(
  tasks: MetricTask[],
  includeOptional: boolean,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const task of tasks) {
    if (!includeOptional && isOptionalTask(task)) continue;
    if (task.state !== "not_started" && task.state !== "in_progress") continue;
    map.set(task.scheduled_date, (map.get(task.scheduled_date) ?? 0) + task.estimated_minutes);
  }
  return map;
}

/** Consistency: days in the period with at least one task completed. */
export function consistencyDays(
  tasks: MetricTask[],
  period: MetricPeriod,
  includeOptional: boolean,
): number {
  const effort = actualEffortByDate(tasks, includeOptional);
  let days = 0;
  for (const date of effort.keys()) {
    if (inPeriod(date, period)) days += 1;
  }
  return days;
}

/** Weekly buckets across the whole fourteen-week window (for the trend). */
export function weeklyCompletionTrend(
  tasks: MetricTask[],
  eventsByTask: Record<string, EventLike[]>,
  weeks: { start_date: string; end_date: string; week_number: number }[],
  includeOptional: boolean,
): { weekNumber: number; resolutionRate: number | null }[] {
  return weeks.map((week) => {
    const counts = outcomeCounts(
      tasks,
      eventsByTask,
      { start: week.start_date, end: week.end_date },
      includeOptional,
    );
    return { weekNumber: week.week_number, resolutionRate: counts.resolutionRate };
  });
}

/** Format a rate for display: em dash for null (zero denominator). */
export function formatRate(rate: number | null): string {
  return rate === null ? "\u2014" : `${Math.round(rate * 100)}%`;
}

export type { ScheduleClassification };
