/**
 * Data access layer. A factory over an authenticated SupabaseClient so the
 * app and the integration tests share one code path. All task mutations flow
 * through the audited RPCs; direct DML is not possible by grant design.
 *
 * Conflict contract (WEBAPP_SPEC.md section 14): a stale expected revision
 * returns { outcome: 'conflict', task: latestRow } for explicit refresh/retry;
 * validation failures throw CommandError with the server's machine prefix.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type TaskState = "not_started" | "in_progress" | "completed" | "skipped" | "archived";

export type TaskCategory = "deep_work" | "practice" | "application" | "review";

export interface TaskRow {
  id: string;
  user_id: string;
  source_week_number: number | null;
  template_task_key: string | null;
  title: string;
  description: string | null;
  acceptance_note: string | null;
  category: TaskCategory;
  role_tags: string[];
  project_id: string | null;
  original_scheduled_date: string;
  scheduled_date: string;
  estimated_minutes: number;
  actual_minutes: number | null;
  revision: number;
  state: TaskState;
  completed_at: string | null;
  skip_reason: string | null;
  evidence_url: string | null;
  evidence_note: string | null;
  source_practice_session_id: string | null;
}

export interface TaskEventRow {
  id: string;
  task_id: string;
  event_type: string;
  occurred_at: string;
  from_scheduled_date: string | null;
  to_scheduled_date: string | null;
  metadata: Record<string, unknown>;
}

export interface ProjectRow {
  id: string;
  project_key: string;
  name: string;
  target_roles: string[];
  budget_minutes: number;
  state: string;
  blocker_note: string | null;
}

export interface PlanWeekRow {
  id: string;
  week_number: number;
  title: string;
  start_date: string;
  end_date: string;
  phase: string;
  exit_check: string;
}

export interface ProfileRow {
  user_id: string;
  timezone: string;
  reminder_local_time: string;
  reminder_installed_at: string | null;
  reminder_verified_at: string | null;
  post_training_enabled: boolean;
  template_version: number | null;
}

export interface TaskInput {
  title: string;
  category: TaskCategory;
  scheduled_date: string;
  estimated_minutes: number;
  description?: string | null;
  acceptance_note?: string | null;
  project_id?: string | null;
  role_tags?: string[];
}

export type TransitionName =
  "start" | "complete" | "reopen" | "reschedule" | "skip" | "edit" | "archive";

export interface TransitionPayload {
  actual_minutes?: number;
  evidence_url?: string | null;
  evidence_note?: string | null;
  to_date?: string;
  to_state?: "not_started" | "in_progress";
  reason?: string;
  title?: string;
  description?: string | null;
  acceptance_note?: string | null;
  estimated_minutes?: number;
  category?: TaskCategory;
  role_tags?: string[];
}

export type TransitionOutcome =
  { outcome: "ok"; task: TaskRow } | { outcome: "conflict"; task: TaskRow };

export class CommandError extends Error {
  readonly kind: string;
  constructor(serverMessage: string) {
    super(serverMessage);
    this.name = "CommandError";
    this.kind = serverMessage.split(":")[0] ?? "error";
  }
}

export class OfflineError extends Error {
  constructor() {
    super("You are offline. Changes cannot be saved right now.");
    this.name = "OfflineError";
  }
}

export function isTaskOptional(task: TaskRow): boolean {
  return task.role_tags.includes("post_training");
}

export interface DailyCheckin {
  local_date: string;
  learning: string | null;
  highest_risk_gap: string | null;
}

export interface PrepApi {
  fetchProfile(): Promise<ProfileRow | null>;
  seedPlan(): Promise<{ status: string; counts?: Record<string, number> }>;
  fetchTasks(): Promise<TaskRow[]>;
  fetchTaskEvents(taskId: string): Promise<TaskEventRow[]>;
  fetchProjects(): Promise<ProjectRow[]>;
  fetchPlanWeeks(): Promise<PlanWeekRow[]>;
  createCustomTask(input: TaskInput): Promise<TaskRow>;
  transition(
    taskId: string,
    expectedRevision: number,
    transition: TransitionName,
    payload?: TransitionPayload,
  ): Promise<TransitionOutcome>;
  unlockPostTraining(optIn: boolean): Promise<{
    status: string;
    deactivated_minutes?: number;
    activated_minutes?: number;
    deactivated_task_keys?: string[];
  }>;
  fetchCheckin(date: string): Promise<DailyCheckin | null>;
  saveCheckin(checkin: DailyCheckin): Promise<void>;
}

export function createPrepApi(client: SupabaseClient): PrepApi {
  async function rpcTransition(
    taskId: string,
    expectedRevision: number,
    transition: TransitionName,
    payload: TransitionPayload | undefined,
  ): Promise<TransitionOutcome> {
    const { data, error } = await client.rpc("transition_task", {
      p_task_id: taskId,
      p_expected_revision: expectedRevision,
      p_transition: transition,
      p_payload: payload ?? {},
    });
    if (error) throw new CommandError(error.message);
    const body = data as { status: string; task: TaskRow };
    if (body.status === "revision_conflict") {
      return { outcome: "conflict", task: body.task };
    }
    return { outcome: "ok", task: body.task };
  }

  return {
    async fetchProfile() {
      const { data, error } = await client.from("profiles").select("*").limit(1);
      if (error) throw new CommandError(error.message);
      return (data?.[0] as ProfileRow | undefined) ?? null;
    },

    async seedPlan() {
      const { data, error } = await client.rpc("seed_plan_v1");
      if (error) throw new CommandError(error.message);
      return data as { status: string; counts?: Record<string, number> };
    },

    async fetchTasks() {
      const { data, error } = await client
        .from("tasks")
        .select("*")
        .order("scheduled_date")
        .order("template_task_key");
      if (error) throw new CommandError(error.message);
      return (data ?? []) as TaskRow[];
    },

    async fetchTaskEvents(taskId) {
      const { data, error } = await client
        .from("task_events")
        .select("*")
        .eq("task_id", taskId)
        .order("occurred_at");
      if (error) throw new CommandError(error.message);
      return (data ?? []) as TaskEventRow[];
    },

    async fetchProjects() {
      const { data, error } = await client.from("projects").select("*").order("project_key");
      if (error) throw new CommandError(error.message);
      return (data ?? []) as ProjectRow[];
    },

    async fetchPlanWeeks() {
      const { data, error } = await client.from("plan_weeks").select("*").order("week_number");
      if (error) throw new CommandError(error.message);
      return (data ?? []) as PlanWeekRow[];
    },

    async createCustomTask(input) {
      const { data, error } = await client.rpc("create_custom_task", {
        p_payload: {
          title: input.title,
          category: input.category,
          scheduled_date: input.scheduled_date,
          estimated_minutes: input.estimated_minutes,
          description: input.description ?? null,
          acceptance_note: input.acceptance_note ?? null,
          project_id: input.project_id ?? null,
          role_tags: input.role_tags ?? [],
        },
      });
      if (error) throw new CommandError(error.message);
      const body = data as { status: string; task: TaskRow };
      return body.task;
    },

    transition: rpcTransition,

    async fetchCheckin(date) {
      const { data, error } = await client
        .from("daily_checkins")
        .select("local_date, learning, highest_risk_gap")
        .eq("local_date", date)
        .limit(1);
      if (error) throw new CommandError(error.message);
      return (data?.[0] as DailyCheckin | undefined) ?? null;
    },

    async saveCheckin(checkin) {
      const { data: userData } = await client.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new CommandError("unauthenticated");
      const { error } = await client.from("daily_checkins").upsert({
        user_id: userId,
        local_date: checkin.local_date,
        learning: checkin.learning,
        highest_risk_gap: checkin.highest_risk_gap,
      });
      if (error) throw new CommandError(error.message);
    },

    async unlockPostTraining(optIn) {
      const { data, error } = await client.rpc("unlock_post_training", {
        p_opt_in: optIn,
      });
      if (error) throw new CommandError(error.message);
      return data as { status: string };
    },
  };
}
