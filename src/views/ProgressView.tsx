/**
 * Progress view (WEBAPP_SPEC.md section 6.7): signals that do not encourage
 * checkbox gaming - cohort-true rates with formula tooltips, distinct
 * outcome counts, a fourteen-week trend, milestone progress, practice
 * volume, rubric trends, the readiness matrix, and consistency as context.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { EventLike } from "../lib/schedule";
import type { MetricTask } from "../lib/metrics";
import {
  actualEffortByDate,
  consistencyDays,
  formatRate,
  outcomeCounts,
  type MetricPeriod,
} from "../lib/metrics";
import {
  latestTenQualifyingCodingSessions,
  MOCK_DIMENSIONS,
  MOCK_DIMENSION_LABELS,
} from "../lib/practice";
import { addDays, formatDisplayDate, torontoToday } from "../lib/toronto";
import { useApi } from "../hooks/useApi";
import { useProfile } from "../hooks/useProfile";
import { useTasks } from "../hooks/useTasks";
import { Card, PageHeader } from "../components/ui";

const TOOLTIP_ON_TIME =
  "On-time completion rate = tasks completed on original schedule / eligible tasks originally due in the period. Rescheduling never moves a task between cohorts.";
const TOOLTIP_RESOLUTION =
  "Resolution rate = tasks completed or skipped / eligible tasks originally due in the period. Archived is a non-completion and never enters the numerator.";
const TOOLTIP_ATTAINMENT =
  "Planned-minute attainment = estimated minutes of tasks completed / estimated minutes of eligible tasks originally due in the period.";
const TOOLTIP_WORKLOAD =
  "Current workload = open estimated minutes grouped by the current scheduled date. This is not plan completion.";
const TOOLTIP_EFFORT =
  "Actual effort = actual minutes grouped by the completion date, not the due date.";
const TOOLTIP_CONSISTENCY =
  "Days with at least one planned task completed - context, not a punitive streak.";

export function ProgressView() {
  const api = useApi();
  const { data: profile } = useProfile();
  const { data: tasks = [] } = useTasks();
  const { data: weeks = [] } = useQuery({
    queryKey: ["plan-weeks"],
    queryFn: () => api.fetchPlanWeeks(),
  });
  const { data: events } = useQuery({
    queryKey: ["all-task-events"],
    queryFn: () => api.fetchAllTaskEvents(),
  });
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.fetchProjects(),
  });
  const { data: milestones = [] } = useQuery({
    queryKey: ["milestones"],
    queryFn: () => api.fetchMilestones(),
  });
  const { data: sessions = [] } = useQuery({
    queryKey: ["practice-sessions"],
    queryFn: () => api.fetchPracticeSessions(),
  });
  const { data: mockScores = [] } = useQuery({
    queryKey: ["mock-scores"],
    queryFn: () => api.fetchMockScores(),
  });
  const { data: gates = [] } = useQuery({
    queryKey: ["readiness-gates"],
    queryFn: () => api.fetchReadinessGates(),
  });

  const postTrainingEnabled = profile?.post_training_enabled ?? false;
  const includeOptional = postTrainingEnabled;

  const eventsByTask = useMemo(() => {
    const map: Record<string, EventLike[]> = {};
    for (const e of events ?? []) {
      map[e.task_id] = map[e.task_id] ?? [];
      map[e.task_id].push(e);
    }
    return map;
  }, [events]);

  const metricTasks = tasks as MetricTask[];
  const today = torontoToday();
  const currentPeriod: MetricPeriod = { start: addDays(today, -6), end: today };
  const previousPeriod: MetricPeriod = {
    start: addDays(today, -13),
    end: addDays(today, -7),
  };

  const current = outcomeCounts(metricTasks, eventsByTask, currentPeriod, includeOptional, today);
  const previous = outcomeCounts(metricTasks, eventsByTask, previousPeriod, includeOptional, today);

  const effort = actualEffortByDate(metricTasks, includeOptional);
  const consistency = consistencyDays(metricTasks, currentPeriod, includeOptional);

  const trend = useMemo(
    () =>
      weeks.map((week) =>
        outcomeCounts(
          metricTasks,
          eventsByTask,
          { start: week.start_date, end: week.end_date },
          includeOptional,
          today,
        ),
      ),
    [weeks, metricTasks, eventsByTask, includeOptional, today],
  );

  const latestTen = latestTenQualifyingCodingSessions(sessions);
  const solved = latestTen.filter((s) =>
    (s.result ?? "").toLowerCase().startsWith("solved"),
  ).length;

  const rubricAverages = useMemo(() => {
    const sums: Record<string, { total: number; count: number }> = {};
    for (const score of mockScores) {
      sums[score.dimension_key] = sums[score.dimension_key] ?? { total: 0, count: 0 };
      sums[score.dimension_key].total += score.score;
      sums[score.dimension_key].count += 1;
    }
    return MOCK_DIMENSIONS.map((dimension) => ({
      dimension,
      average: sums[dimension] ? sums[dimension].total / sums[dimension].count : null,
      count: sums[dimension]?.count ?? 0,
    }));
  }, [mockScores]);

  return (
    <div className="progress-view">
      <PageHeader
        title="Progress"
        description={
          <>
            Cohorts freeze at the original scheduled date. Skipping or rescheduling never inflates
            completion.
          </>
        }
      />

      <section aria-labelledby="p-rates" className="progress-rates">
        <h2 id="p-rates">Completion quality</h2>
        <div className="progress-periods">
          <Card className="progress-period" ariaLabel="Current 7 days">
            <h3>Current 7 days</h3>
            <div className="rate-grid">
              <div className="rate" title={TOOLTIP_ON_TIME}>
                <span className="rate-value">{formatRate(current.onTimeCompletionRate)}</span>
                <span className="rate-label">On-time completion</span>
              </div>
              <div className="rate" title={TOOLTIP_RESOLUTION}>
                <span className="rate-value">{formatRate(current.resolutionRate)}</span>
                <span className="rate-label">Resolution</span>
              </div>
              <div className="rate" title={TOOLTIP_ATTAINMENT}>
                <span className="rate-value">{formatRate(current.plannedMinuteAttainment)}</span>
                <span className="rate-label">Planned-minute attainment</span>
              </div>
            </div>
          </Card>
          <Card className="progress-period" ariaLabel="Previous 7 days">
            <h3>Previous 7 days</h3>
            <div className="rate-grid">
              <div className="rate" title={TOOLTIP_ON_TIME}>
                <span className="rate-value">{formatRate(previous.onTimeCompletionRate)}</span>
                <span className="rate-label">On-time completion</span>
              </div>
              <div className="rate" title={TOOLTIP_RESOLUTION}>
                <span className="rate-value">{formatRate(previous.resolutionRate)}</span>
                <span className="rate-label">Resolution</span>
              </div>
              <div className="rate" title={TOOLTIP_ATTAINMENT}>
                <span className="rate-value">{formatRate(previous.plannedMinuteAttainment)}</span>
                <span className="rate-label">Planned-minute attainment</span>
              </div>
            </div>
          </Card>
        </div>
        <p className="overdue-note">
          Current period: {current.completedOnOriginalSchedule} on original schedule,{" "}
          {current.completedAfterProactiveReschedule} after proactive reschedule,{" "}
          {current.completedLate} late, {current.skipped} skipped, {current.archived} archived,{" "}
          {current.unresolvedOverdue} unresolved overdue.
        </p>
      </section>

      <section aria-labelledby="p-trend" className="progress-trend">
        <h2 id="p-trend">Fourteen-week resolution trend</h2>
        <div className="trend-bars" role="img" aria-label="Weekly resolution trend">
          {weeks.map((week, i) => {
            const rate = trend[i]?.resolutionRate ?? null;
            return (
              <div
                key={week.id}
                className="trend-col"
                title={`Week ${week.week_number}: ${formatRate(rate)}`}
              >
                <div
                  className="trend-bar"
                  style={{ height: `${rate === null ? 2 : Math.max(4, rate * 64)}px` }}
                  data-empty={rate === null}
                />
                <span className="trend-label">W{week.week_number}</span>
              </div>
            );
          })}
        </div>
        <p className="sr-only">
          {weeks.length === 0
            ? "No weekly trend data is available."
            : weeks
                .map(
                  (week, index) =>
                    `Week ${week.week_number}: ${formatRate(trend[index]?.resolutionRate ?? null)}`,
                )
                .join(". ")}
        </p>
      </section>

      <section aria-labelledby="p-effort" className="progress-effort">
        <h2 id="p-effort">Effort and workload</h2>
        <p title={TOOLTIP_EFFORT}>
          Actual effort (last 7 days):{" "}
          {[...effort.entries()]
            .filter(([date]) => date >= currentPeriod.start)
            .map(([date, minutes]) => `${formatDisplayDate(date)}: ${minutes} min`)
            .join(", ") || "none recorded"}
        </p>
        <p title={TOOLTIP_CONSISTENCY}>
          Consistency: {consistency} day{consistency === 1 ? "" : "s"} with at least one task
          completed in the last 7 days.
        </p>
        <p title={TOOLTIP_WORKLOAD}>
          Current open workload:{" "}
          {[...currentWorkloadDisplay(tasks, includeOptional).entries()]
            .slice(0, 7)
            .map(([date, minutes]) => `${date}: ${minutes} min`)
            .join(", ") || "nothing open"}
        </p>
      </section>

      <section aria-labelledby="p-projects" className="progress-projects">
        <h2 id="p-projects">Milestone progress</h2>
        <ul>
          {projects.map((project) => {
            const ms = milestones.filter((m) => m.project_id === project.id);
            const done = ms.filter((m) => m.completed_at !== null).length;
            return (
              <li key={project.id}>
                {project.name}: {done}/{ms.length} milestones
                {project.state === "locked" ? " (locked)" : ""}
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="p-practice" className="progress-practice">
        <h2 id="p-practice">Practice</h2>
        <p>
          Latest-ten coding window: {solved}/{latestTen.length} solved
          {latestTen.length < 10
            ? ` (${10 - latestTen.length} more qualifying sessions needed)`
            : ""}
          .
        </p>
        <h3>Mock rubric averages by dimension</h3>
        <ul className="rubric-averages">
          {rubricAverages.map(({ dimension, average, count }) => (
            <li key={dimension}>
              {MOCK_DIMENSION_LABELS[dimension]}: {average === null ? "\u2014" : average.toFixed(1)}
              <span className="chip">{count} scored</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="p-readiness" className="progress-readiness">
        <h2 id="p-readiness">Readiness matrix</h2>
        <table className="readiness-matrix">
          <thead>
            <tr>
              <th scope="col">Role</th>
              <th scope="col">Gate</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {gates.map((gate) => (
              <tr key={gate.id}>
                <td>
                  {gate.role_key === "data_eval"
                    ? "Data/Eval"
                    : gate.role_key === "agent_env"
                      ? "Agent Env"
                      : "Post-Training"}
                </td>
                <td>{gate.title}</td>
                <td>{gate.state.replace(/_/g, " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function currentWorkloadDisplay(
  tasks: MetricTask[],
  includeOptional: boolean,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const task of tasks) {
    if (!includeOptional && task.role_tags.includes("post_training")) continue;
    if (task.state !== "not_started" && task.state !== "in_progress") continue;
    map.set(task.scheduled_date, (map.get(task.scheduled_date) ?? 0) + task.estimated_minutes);
  }
  return new Map([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
}
