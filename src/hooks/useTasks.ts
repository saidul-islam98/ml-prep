/**
 * Tasks query plus the audited transition mutation with optimistic UI and
 * visible rollback (WEBAPP_SPEC.md sections 14 and 16):
 *  - optimistic state is rolled back on error;
 *  - a stale revision returns the latest row for explicit refresh/retry and
 *    is never silently overwritten;
 *  - mutations are refused while offline (offline mode is read-only).
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  PrepApi,
  TaskRow,
  TransitionName,
  TransitionOutcome,
  TransitionPayload,
} from "../lib/api";
import { OfflineError } from "../lib/api";
import { useApi } from "./useApi";

export function useTasks() {
  const api = useApi();
  return useQuery({ queryKey: ["tasks"], queryFn: () => api.fetchTasks() });
}

export function useTaskEvents(taskId: string | null) {
  const api = useApi();
  return useQuery({
    queryKey: ["task-events", taskId],
    queryFn: () => api.fetchTaskEvents(taskId!),
    enabled: taskId !== null,
  });
}

/** Apply the expected optimistic effect of a transition to a task row. */
export function optimisticApply(
  task: TaskRow,
  transition: TransitionName,
  payload: TransitionPayload | undefined,
): TaskRow {
  const nowIso = new Date().toISOString();
  const base = { ...task, revision: task.revision + 1 };
  switch (transition) {
    case "start":
      return { ...base, state: "in_progress" };
    case "complete":
      return {
        ...base,
        state: "completed",
        completed_at: nowIso,
        actual_minutes: payload?.actual_minutes ?? task.estimated_minutes,
        evidence_url: payload?.evidence_url ?? task.evidence_url,
        evidence_note: payload?.evidence_note ?? task.evidence_note,
      };
    case "reopen":
      return {
        ...base,
        state: payload?.to_state ?? "not_started",
        completed_at: null,
        actual_minutes: null,
        skip_reason: null,
      };
    case "reschedule":
      return { ...base, scheduled_date: payload?.to_date ?? task.scheduled_date };
    case "skip":
      return { ...base, state: "skipped", skip_reason: payload?.reason ?? null };
    case "edit":
      return {
        ...base,
        title: payload?.title ?? task.title,
        description:
          payload && "description" in payload ? (payload.description ?? null) : task.description,
        acceptance_note:
          payload && "acceptance_note" in payload
            ? (payload.acceptance_note ?? null)
            : task.acceptance_note,
        estimated_minutes: payload?.estimated_minutes ?? task.estimated_minutes,
        evidence_url:
          payload && "evidence_url" in payload ? (payload.evidence_url ?? null) : task.evidence_url,
        evidence_note:
          payload && "evidence_note" in payload
            ? (payload.evidence_note ?? null)
            : task.evidence_note,
      };
    case "archive":
      return { ...base, state: "archived" };
  }
}

export interface TransitionVariables {
  task: TaskRow;
  transition: TransitionName;
  payload?: TransitionPayload;
}

export function useTaskTransition() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation<
    TransitionOutcome,
    Error,
    TransitionVariables,
    { previous?: TaskRow[] } | undefined
  >({
    mutationFn: ({ task, transition, payload }) => {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        return Promise.reject(new OfflineError());
      }
      return api.transition(task.id, task.revision, transition, payload);
    },
    onMutate: async ({ task, transition, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previous = queryClient.getQueryData<TaskRow[]>(["tasks"]);
      if (previous) {
        queryClient.setQueryData<TaskRow[]>(["tasks"], (rows) =>
          rows?.map((row) =>
            row.id === task.id ? optimisticApply(row, transition, payload) : row,
          ),
        );
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      // Visible rollback: the optimistic change is discarded on failure.
      if (context?.previous) {
        queryClient.setQueryData(["tasks"], context.previous);
      }
    },
    onSuccess: (result) => {
      if (result.outcome === "ok") {
        queryClient.setQueryData<TaskRow[]>(["tasks"], (rows) =>
          rows?.map((row) => (row.id === result.task.id ? result.task : row)),
        );
      }
      // Conflicts keep the optimistic row until invalidateQueries lands the
      // authoritative server row; the UI surfaces the conflict explicitly.
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useCreateCustomTask() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<PrepApi["createCustomTask"]>[0]) => {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        return Promise.reject(new OfflineError());
      }
      return api.createCustomTask(input);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
}
