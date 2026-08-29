/**
 * Shared UI constants for task actions. Skip reasons are a configurable list
 * (WEBAPP_SPEC.md section 6.2); the stored reason combines the choice and the
 * optional note.
 */

export const SKIP_REASONS = [
  "Not enough protected time today",
  "Covered by other work",
  "No longer relevant this week",
  "Deliberately postponed with a plan",
  "Blocked by something outside my control",
  "Other (explained in note)",
] as const;

export function composeSkipReason(reason: string, note: string | null): string {
  const trimmedNote = note?.trim();
  return trimmedNote ? `${reason} - ${trimmedNote}` : reason;
}

export const CATEGORY_LABELS: Record<string, string> = {
  deep_work: "Deep work",
  practice: "Practice",
  application: "Application",
  review: "Review",
};

export const ROLE_LABELS: Record<string, string> = {
  data_eval: "Data/Eval",
  agent_env: "Agent Env",
  post_training: "Post-Training",
};

export const STATE_LABELS: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  skipped: "Skipped",
  archived: "Archived",
  overdue: "Overdue",
};

/** Client-side HTTPS validation mirroring the database constraint. */
export function isValidHttpsUrl(value: string): boolean {
  if (!value) return true; // empty is allowed (evidence is optional)
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Friendly, non-sensitive messages for server command failures. */
export function commandErrorMessage(error: unknown): string {
  const kind = (error as { kind?: string })?.kind;
  switch (kind) {
    case "invalid_transition":
      return "That action isn't available for the task's current state. Refresh to see the latest state.";
    case "invalid_date":
      return "Choose today or a later date (Toronto time).";
    case "task_not_found":
      return "This task was not found for your account. Refresh to sync.";
    case "unauthenticated":
      return "Your session ended. Sign in again to continue.";
    default:
      return "Saving failed - your change was not applied. Try again.";
  }
}
