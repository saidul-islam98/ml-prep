/**
 * Overdue resolution queue (WEBAPP_SPEC.md sections 6.2 and 7.3): one task at
 * a time, blocking today's list when unresolved overdue work exists. No
 * background process ever moves tasks - the user chooses Tomorrow, Choose
 * date, or Skip for each one.
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { TaskRow, TransitionName, TransitionPayload, TransitionOutcome } from "../lib/api";
import { isTaskOptional } from "../lib/api";
import { deriveOverdue, rescheduleCount } from "../lib/schedule";
import { useApi } from "../hooks/useApi";
import { TaskCard } from "./TaskCard";

export interface OverdueQueueProps {
  tasks: TaskRow[];
  today: string;
  offline: boolean;
  postTrainingEnabled: boolean;
  onTransition: (
    task: TaskRow,
    transition: TransitionName,
    payload?: TransitionPayload,
  ) => Promise<TransitionOutcome>;
}

export function OverdueQueue({
  tasks,
  today,
  offline,
  postTrainingEnabled,
  onTransition,
}: OverdueQueueProps) {
  const api = useApi();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const overdue = useMemo(
    () =>
      deriveOverdue(
        tasks.filter((t) => !isTaskOptional(t) || postTrainingEnabled),
        today,
      ),
    [tasks, today, postTrainingEnabled],
  );

  // Reschedule counts come from the immutable event history.
  const eventQueries = useQuery({
    queryKey: ["overdue-events", overdue.map((t) => t.id).join(",")],
    queryFn: async () => {
      const entries = await Promise.all(
        overdue.map(async (t) => [t.id, await api.fetchTaskEvents(t.id)] as const),
      );
      return Object.fromEntries(entries);
    },
    enabled: overdue.length > 0,
  });

  if (overdue.length === 0) return null;

  const active = overdue.find((t) => !dismissed.has(t.id)) ?? null;

  return (
    <section aria-labelledby="overdue-title" className="overdue-queue">
      <h2 id="overdue-title">Unresolved overdue work ({overdue.length})</h2>
      <p className="overdue-note">
        Overdue tasks never move on their own. Choose a new date or skip each one explicitly.
      </p>

      {active ? (
        <>
          <TaskCard
            task={active}
            variant="overdue"
            rescheduleCount={rescheduleCount(eventQueries.data?.[active.id] ?? [])}
            offline={offline}
            onTransition={onTransition}
          />
          {overdue.length > 1 && (
            <div className="task-actions">
              <button
                type="button"
                onClick={() => setDismissed((prev) => new Set(prev).add(active.id))}
              >
                Show next ({overdue.length - 1} more)
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="overdue-note">
          Queue dismissed for this session - the tasks below stay overdue until you resolve them.
        </p>
      )}

      {/* Dismissed tasks remain visible and unresolved (section 6.2). */}
      {overdue
        .filter((t) => dismissed.has(t.id))
        .map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            variant="overdue"
            rescheduleCount={rescheduleCount(eventQueries.data?.[t.id] ?? [])}
            offline={offline}
            onTransition={onTransition}
          />
        ))}

      {dismissed.size > 0 && active && (
        <button type="button" className="link-button" onClick={() => setDismissed(new Set())}>
          Show all overdue tasks again
        </button>
      )}
    </section>
  );
}
