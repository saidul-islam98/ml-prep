/**
 * Plan view (WEBAPP_SPEC.md section 6.3): fourteen collapsible week sections
 * with date ranges, phases, exit checks, and weekly progress; filters for
 * role, category, project, state, and date; validated custom task creation,
 * editing, archiving, and per-task history. Grouping always uses scheduled
 * dates - source_week_number is provenance only.
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  TaskRow,
  TransitionName,
  TransitionPayload,
  TransitionOutcome,
  TaskCategory,
} from "../lib/api";
import { isTaskOptional } from "../lib/api";
import { formatDisplayDate } from "../lib/toronto";
import { CATEGORY_LABELS, STATE_LABELS, commandErrorMessage } from "../lib/constants";
import { useApi } from "../hooks/useApi";
import { useProfile } from "../hooks/useProfile";
import { useCreateCustomTask, useTaskTransition, useTasks } from "../hooks/useTasks";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { TaskCard } from "../components/TaskCard";
import { ComprehensiveStudyResources, WeeklyStudyResources } from "../components/StudyResources";

interface Filters {
  role: string;
  category: string;
  project: string;
  state: string;
  from: string;
  to: string;
}

const EMPTY_FILTERS: Filters = {
  role: "all",
  category: "all",
  project: "all",
  state: "all",
  from: "",
  to: "",
};

export function PlanView() {
  const api = useApi();
  const { data: profile } = useProfile();
  const { data: tasks = [], isLoading, isError } = useTasks();
  const { data: weeks = [] } = useQuery({
    queryKey: ["plan-weeks"],
    queryFn: () => api.fetchPlanWeeks(),
  });
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.fetchProjects(),
  });

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(() => new Set([1]));
  const [showCreate, setShowCreate] = useState(false);
  const transition = useTaskTransition();
  const create = useCreateCustomTask();
  const offline = !useOnlineStatus();

  const postTrainingEnabled = profile?.post_training_enabled ?? false;

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (!postTrainingEnabled && isTaskOptional(t)) return false;
      if (filters.role !== "all" && !t.role_tags.includes(filters.role)) return false;
      if (filters.category !== "all" && t.category !== filters.category) return false;
      if (filters.project !== "all") {
        const project = projects.find((p) => p.id === t.project_id);
        if (project?.project_key !== filters.project) return false;
      }
      if (filters.state !== "all" && t.state !== filters.state) return false;
      if (filters.from && t.scheduled_date < filters.from) return false;
      if (filters.to && t.scheduled_date > filters.to) return false;
      return true;
    });
  }, [tasks, filters, projects, postTrainingEnabled]);

  function tasksForWeek(week: {
    week_number: number;
    start_date: string;
    end_date: string;
  }): TaskRow[] {
    // Grouping uses scheduled dates only; source_week_number is provenance
    // and never controls grouping or metrics (WEBAPP_SPEC.md section 10.3).
    return filtered.filter(
      (t) => t.scheduled_date >= week.start_date && t.scheduled_date <= week.end_date,
    );
  }

  async function handleTransition(
    task: TaskRow,
    name: TransitionName,
    payload?: TransitionPayload,
  ): Promise<TransitionOutcome> {
    return transition.mutateAsync({ task, transition: name, payload });
  }

  const projectNameById = new Map(projects.map((p) => [p.id, p.name]));

  return (
    <div className="plan-view">
      <section aria-labelledby="plan-title" className="curriculum-intro">
        <p className="curriculum-kicker">14-week curriculum</p>
        <h1 id="plan-title">Plan</h1>
        <p className="overdue-note">
          Fourteen weeks, August 31 - December 6, 2026. Tasks are grouped by their scheduled date;
          reschedules move tasks without erasing the original schedule.
        </p>

        <div className="plan-filters">
          <label htmlFor="f-role">Role</label>
          <select
            id="f-role"
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          >
            <option value="all">All roles</option>
            <option value="data_eval">Data/Eval</option>
            <option value="agent_env">Agent Env</option>
            <option value="post_training">Post-Training</option>
          </select>
          <label htmlFor="f-category">Category</label>
          <select
            id="f-category"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="all">All categories</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <label htmlFor="f-project">Project</label>
          <select
            id="f-project"
            value={filters.project}
            onChange={(e) => setFilters({ ...filters, project: e.target.value })}
          >
            <option value="all">All projects</option>
            {projects.map((p) => (
              <option key={p.project_key} value={p.project_key}>
                {p.name}
              </option>
            ))}
            <option value="none">No project</option>
          </select>
          <label htmlFor="f-state">State</label>
          <select
            id="f-state"
            value={filters.state}
            onChange={(e) => setFilters({ ...filters, state: e.target.value })}
          >
            <option value="all">All states</option>
            {Object.entries(STATE_LABELS)
              .slice(0, 5)
              .map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
          </select>
          <label htmlFor="f-from">From</label>
          <input
            id="f-from"
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
          />
          <label htmlFor="f-to">To</label>
          <input
            id="f-to"
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
          />
          <button type="button" className="link-button" onClick={() => setFilters(EMPTY_FILTERS)}>
            Clear filters
          </button>
        </div>

        <div className="task-actions">
          <button type="button" onClick={() => setShowCreate((s) => !s)}>
            {showCreate ? "Close custom task form" : "Add custom task"}
          </button>
        </div>
        {showCreate && (
          <CreateTaskForm
            projects={projects}
            creating={create.isPending}
            error={create.error}
            onCreate={async (input) => {
              await create.mutateAsync(input);
            }}
          />
        )}
      </section>

      {isLoading && <p role="status">Loading plan…</p>}
      {isError && <p role="alert">Could not load the plan. Refresh to retry.</p>}

      <ComprehensiveStudyResources />

      {weeks.map((week) => {
        const weekTasks = tasksForWeek(week);
        const plannedMinutes = weekTasks.reduce((s, t) => s + t.estimated_minutes, 0);
        const completedMinutes = weekTasks
          .filter((t) => t.state === "completed")
          .reduce((s, t) => s + (t.actual_minutes ?? 0), 0);
        const isOpen = openWeeks.has(week.week_number);
        return (
          <section key={week.id} aria-labelledby={`week-${week.week_number}`} className="plan-week">
            <button
              type="button"
              className="plan-week-toggle"
              aria-expanded={isOpen}
              onClick={() =>
                setOpenWeeks((prev) => {
                  const next = new Set(prev);
                  if (next.has(week.week_number)) next.delete(week.week_number);
                  else next.add(week.week_number);
                  return next;
                })
              }
            >
              <p className="plan-week__chapter">Chapter {week.week_number}</p>
              <h2 id={`week-${week.week_number}`}>
                Week {week.week_number}: {week.title}
              </h2>
              <p>
                {formatDisplayDate(week.start_date)} - {formatDisplayDate(week.end_date)} -{" "}
                {completedMinutes}/{plannedMinutes} min completed
              </p>
            </button>
            {isOpen && (
              <>
                <p className="plan-exit-check">{`Exit check: ${week.exit_check}`}</p>
                <WeeklyStudyResources weekNumber={week.week_number} />
                {weekTasks.length === 0 ? (
                  <p className="overdue-note">No tasks match the current filters.</p>
                ) : (
                  weekTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      projectName={
                        task.project_id ? projectNameById.get(task.project_id) : undefined
                      }
                      offline={offline}
                      onTransition={handleTransition}
                    />
                  ))
                )}
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}

function CreateTaskForm({
  projects,
  creating,
  error,
  onCreate,
}: {
  projects: { id: string; name: string }[];
  creating: boolean;
  error: unknown;
  onCreate: (input: {
    title: string;
    category: TaskCategory;
    scheduled_date: string;
    estimated_minutes: number;
    description: string | null;
    project_id: string | null;
  }) => Promise<void>;
}) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Toronto" });
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TaskCategory>("deep_work");
  const [date, setDate] = useState(today);
  const [minutes, setMinutes] = useState("60");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    const estimated = Number(minutes);
    if (!trimmed) {
      setValidationError("A title is required.");
      return;
    }
    if (!Number.isInteger(estimated) || estimated <= 0) {
      setValidationError("Estimated minutes must be a positive whole number.");
      return;
    }
    setValidationError(null);
    await onCreate({
      title: trimmed,
      category,
      scheduled_date: date,
      estimated_minutes: estimated,
      description: description.trim() || null,
      project_id: projectId || null,
    });
    setTitle("");
    setDescription("");
  }

  return (
    <form className="task-dialog" onSubmit={(e) => void submit(e)}>
      <h3>New custom task</h3>
      <label htmlFor="ct-title">Title</label>
      <input id="ct-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <label htmlFor="ct-category">Category</label>
      <select
        id="ct-category"
        value={category}
        onChange={(e) => setCategory(e.target.value as TaskCategory)}
      >
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <label htmlFor="ct-date">Date</label>
      <input id="ct-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <label htmlFor="ct-minutes">Estimated minutes</label>
      <input
        id="ct-minutes"
        type="number"
        value={minutes}
        onChange={(e) => setMinutes(e.target.value)}
      />
      <label htmlFor="ct-description">Description (optional)</label>
      <input
        id="ct-description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <label htmlFor="ct-project">Project (optional)</label>
      <select id="ct-project" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
        <option value="">No project</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      {validationError && (
        <p role="alert" className="task-error-text">
          {validationError}
        </p>
      )}
      {error instanceof Error && (
        <p role="alert" className="task-error-text">
          {commandErrorMessage(error)}
        </p>
      )}
      <div className="task-actions">
        <button type="submit" disabled={creating}>
          {creating ? "Creating…" : "Create task"}
        </button>
      </div>
    </form>
  );
}
