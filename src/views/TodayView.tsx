/**
 * Today view (WEBAPP_SPEC.md section 6.2): current Toronto date and plan
 * week, minutes summary, the blocking overdue resolution queue, today's task
 * groups, and the end-of-day check-in.
 */

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TaskRow, TransitionName, TransitionPayload, TransitionOutcome } from "../lib/api";
import { isTaskOptional } from "../lib/api";
import { torontoToday, formatDisplayDateWithYear, torontoParts } from "../lib/toronto";
import { fetchClockCheck } from "../lib/clock";
import { CATEGORY_LABELS } from "../lib/constants";
import { useApi } from "../hooks/useApi";
import { useProfile } from "../hooks/useProfile";
import { useTaskTransition, useTasks } from "../hooks/useTasks";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { TaskCard } from "../components/TaskCard";
import { OverdueQueue } from "../components/OverdueQueue";
import { VIEWS } from "./views";

const CATEGORY_ORDER = ["deep_work", "practice", "application", "review"] as const;

export function TodayView() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { data: tasks = [], isLoading, isError } = useTasks();
  const transition = useTaskTransition();

  const today = torontoToday();
  const postTrainingEnabled = profile?.post_training_enabled ?? false;

  const visible = useMemo(
    () => tasks.filter((t) => !isTaskOptional(t) || postTrainingEnabled),
    [tasks, postTrainingEnabled],
  );
  const todays = useMemo(() => visible.filter((t) => t.scheduled_date === today), [visible, today]);

  const plannedMinutes = todays.reduce((sum, t) => sum + t.estimated_minutes, 0);
  const completedMinutes = todays
    .filter((t) => t.state === "completed")
    .reduce((sum, t) => sum + (t.actual_minutes ?? 0), 0);
  const completedCount = todays.filter((t) => t.state === "completed").length;
  const roleTags = [...new Set(todays.flatMap((t) => t.role_tags))].filter(
    (r) => r !== "post_training" || postTrainingEnabled,
  );

  // Clock-skew warning (section 8.3): deadlines are server-side.
  const [skewWarning, setSkewWarning] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    if (url) {
      void fetchClockCheck(url).then((check) => {
        if (active && check?.exceedsThreshold) {
          setSkewWarning(
            `This device's clock differs from the server by about ${Math.round(
              Math.abs(check.deltaMs) / 60_000,
            )} minutes. Deadline checks use server time.`,
          );
        }
      });
    }
    return () => {
      active = false;
    };
  }, []);

  // Refetch on focus and after reconnecting (section 14).
  useEffect(() => {
    const refetch = () => void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    window.addEventListener("online", refetch);
    return () => window.removeEventListener("online", refetch);
  }, [queryClient]);

  async function handleTransition(
    task: TaskRow,
    name: TransitionName,
    payload?: TransitionPayload,
  ): Promise<TransitionOutcome> {
    return transition.mutateAsync({ task, transition: name, payload });
  }

  const week = useCurrentWeek(today);
  const offline = !useOnlineStatus();

  return (
    <div className="today-view">
      <section aria-labelledby="today-summary" className="today-summary">
        <h1 id="today-summary">Today</h1>
        <p className="today-date">{formatDisplayDateWithYear(today)}</p>
        {week && (
          <p className="today-week">
            Week {week.week_number} of 14 - {week.phase}
          </p>
        )}
        <p className="today-minutes">
          {`${completedMinutes} of ${plannedMinutes} planned minutes done - ${completedCount}/${todays.length} tasks completed`}
        </p>
        {roleTags.length > 0 && (
          <p className="today-roles">
            Focus:{" "}
            {roleTags
              .map((r) => (r === "data_eval" ? "Data/Eval" : r === "agent_env" ? "Agent Env" : r))
              .join(", ")}
          </p>
        )}
        {skewWarning && (
          <p role="alert" className="clock-warning">
            {skewWarning}
          </p>
        )}
        {offline && (
          <p role="alert" className="clock-warning">
            You are offline. This view is read-only until you reconnect.
          </p>
        )}
      </section>

      {isLoading && <p role="status">Loading tasks…</p>}
      {isError && <p role="alert">Could not load your tasks. Check your connection and refresh.</p>}

      <OverdueQueue
        tasks={tasks}
        today={today}
        offline={offline}
        postTrainingEnabled={postTrainingEnabled}
        onTransition={handleTransition}
      />

      {todays.length === 0 ? (
        <section className="placeholder">
          <h2>No tasks scheduled for today</h2>
          <p>
            Enjoy the breathing room, or <a href={`#${VIEWS.plan.path}`}>open the Plan</a> to see
            what is coming next.
          </p>
        </section>
      ) : (
        CATEGORY_ORDER.map((category) => {
          const group = todays.filter((t) => t.category === category);
          if (group.length === 0) return null;
          return (
            <section key={category} aria-labelledby={`group-${category}`}>
              <h2 id={`group-${category}`}>{CATEGORY_LABELS[category]}</h2>
              {group.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  offline={offline}
                  onTransition={handleTransition}
                />
              ))}
            </section>
          );
        })
      )}

      <EndOfDayCheckin today={today} />
    </div>
  );
}

function useCurrentWeek(today: string) {
  const api = useApi();
  const { data: weeks } = useQuery({
    queryKey: ["plan-weeks"],
    queryFn: () => api.fetchPlanWeeks(),
  });
  return useMemo(
    () => weeks?.find((w) => today >= w.start_date && today <= w.end_date) ?? null,
    [weeks, today],
  );
}

function EndOfDayCheckin({ today }: { today: string }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const parts = torontoParts(new Date());
  const afterFive = parts.hour >= 17;
  const [open, setOpen] = useState(afterFive);

  const { data: existing } = useQuery({
    queryKey: ["checkin", today],
    queryFn: () => api.fetchCheckin(today),
  });

  const [learning, setLearning] = useState("");
  const [gap, setGap] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setLearning(existing.learning ?? "");
      setGap(existing.highest_risk_gap ?? "");
    }
  }, [existing]);

  const save = useMutation({
    mutationFn: () =>
      api.saveCheckin({
        local_date: today,
        learning: learning.trim() || null,
        highest_risk_gap: gap.trim() || null,
      }),
    onSuccess: () => {
      setSaved(true);
      void queryClient.invalidateQueries({ queryKey: ["checkin", today] });
    },
    onError: () => setError("Could not save the check-in. Try again."),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    setSaved(false);
    setError(null);
    save.mutate();
  }

  return (
    <section aria-labelledby="checkin-title" className="checkin">
      <h2 id="checkin-title">
        End-of-day check-in
        {!afterFive && <span className="chip">opens automatically after 5:00 PM</span>}
      </h2>
      <p className="overdue-note">
        One short learning and tomorrow's highest-risk gap - journaling is never required to
        complete tasks.
      </p>
      <button type="button" className="link-button" onClick={() => setOpen((o) => !o)}>
        {open ? "Hide check-in" : "Open check-in"}
      </button>
      {open && (
        <form onSubmit={submit}>
          <label htmlFor="checkin-learning">One short learning</label>
          <input
            id="checkin-learning"
            type="text"
            value={learning}
            onChange={(e) => setLearning(e.target.value)}
          />
          <label htmlFor="checkin-gap">Next day's highest-risk gap</label>
          <input
            id="checkin-gap"
            type="text"
            value={gap}
            onChange={(e) => setGap(e.target.value)}
          />
          <div className="task-actions">
            <button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save check-in"}
            </button>
          </div>
          {saved && (
            <p role="status" className="overdue-note">
              Saved.
            </p>
          )}
          {error && (
            <p role="alert" className="task-error-text">
              {error}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
