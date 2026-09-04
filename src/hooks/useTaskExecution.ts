import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TaskExecutionProgressInput, TaskExecutionProgressRow } from "../lib/api";
import { OfflineError } from "../lib/api";
import { useApi } from "./useApi";

export function emptyTaskExecution(): TaskExecutionProgressInput {
  return {
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
  };
}

export function useTaskExecution(taskId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const queryKey = ["task-execution", taskId] as const;
  const query = useQuery({
    queryKey,
    queryFn: () => api.fetchTaskExecution?.(taskId) ?? Promise.resolve(null),
  });

  // Monotonic revision counter stored in a ref so it survives re-renders.
  // Optimistic cache writes cause re-renders; a local `let` would reset to 0
  // on every render, defeating the stale-response protection.
  const latestRevision = useRef(0);

  const save = useMutation({
    mutationFn: async (progress: TaskExecutionProgressInput) => {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        throw new OfflineError();
      }
      if (!api.saveTaskExecution) {
        return {
          task_id: taskId,
          user_id: "local-test",
          updated_at: new Date().toISOString(),
          ...progress,
        } satisfies TaskExecutionProgressRow;
      }
      return api.saveTaskExecution(taskId, progress);
    },
    onMutate: async (progress) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TaskExecutionProgressRow | null>(queryKey);
      const revision = ++latestRevision.current;
      queryClient.setQueryData<TaskExecutionProgressRow>(queryKey, {
        task_id: taskId,
        user_id: previous?.user_id ?? "pending",
        updated_at: new Date().toISOString(),
        ...progress,
      });
      return { previous, revision };
    },
    onError: (_error, _progress, context) => {
      // Only roll back if no newer mutation has since been dispatched.
      // Rolling back when a newer write exists would restore stale state.
      if (context && context.revision === latestRevision.current) {
        queryClient.setQueryData(queryKey, context.previous ?? null);
      }
    },
    onSuccess: (saved, _progress, context) => {
      // Only apply the server response when no newer mutation has since fired.
      if (context && context.revision === latestRevision.current) {
        queryClient.setQueryData(queryKey, saved);
      }
    },
  });

  const progress: TaskExecutionProgressInput = query.data
    ? {
        completed_todo_ids: query.data.completed_todo_ids,
        completed_criterion_ids: query.data.completed_criterion_ids,
        opened_resource_ids: query.data.opened_resource_ids,
        current_step_index: query.data.current_step_index,
        elapsed_seconds: query.data.elapsed_seconds,
        timer_started_at: query.data.timer_started_at,
        step_notes: query.data.step_notes,
        reflection_note: query.data.reflection_note,
        started_at: query.data.started_at,
        paused_at: query.data.paused_at,
      }
    : emptyTaskExecution();

  return { ...query, progress, saveProgress: save.mutateAsync, isSaving: save.isPending };
}

export function elapsedSeconds(progress: TaskExecutionProgressInput, now = Date.now()): number {
  if (!progress.timer_started_at) return progress.elapsed_seconds;
  return (
    progress.elapsed_seconds +
    Math.max(0, Math.floor((now - Date.parse(progress.timer_started_at)) / 1000))
  );
}

export function pauseExecution(
  progress: TaskExecutionProgressInput,
  now = new Date(),
): TaskExecutionProgressInput {
  return {
    ...progress,
    elapsed_seconds: elapsedSeconds(progress, now.getTime()),
    timer_started_at: null,
    paused_at: now.toISOString(),
  };
}
