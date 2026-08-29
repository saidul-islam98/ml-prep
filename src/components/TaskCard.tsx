/**
 * Task card with state controls (WEBAPP_SPEC.md section 6.2). Every action
 * routes through the transactional RPC with the last-seen revision; failures
 * and stale-revision conflicts are surfaced inline with refresh/retry.
 */

import { useState, type FormEvent } from "react";
import type { TaskRow, TransitionName, TransitionOutcome, TransitionPayload } from "../lib/api";
import { OfflineError } from "../lib/api";
import { useTaskEvents } from "../hooks/useTasks";
import {
  CATEGORY_LABELS,
  ROLE_LABELS,
  STATE_LABELS,
  SKIP_REASONS,
  composeSkipReason,
  commandErrorMessage,
  isValidHttpsUrl,
} from "../lib/constants";

export interface TaskCardProps {
  task: TaskRow;
  projectName?: string;
  /** Overdue queue mode: shows original date + reschedule count context. */
  variant?: "standard" | "overdue";
  rescheduleCount?: number;
  offline?: boolean;
  onTransition: (
    task: TaskRow,
    transition: TransitionName,
    payload?: TransitionPayload,
  ) => Promise<TransitionOutcome>;
}

type Dialog = "complete" | "skip" | "reschedule" | "evidence" | "edit" | "archive" | null;

interface ConflictState {
  latestTask: TaskRow;
  transition: TransitionName;
  payload?: TransitionPayload;
}

export function TaskCard({
  task,
  projectName,
  variant = "standard",
  rescheduleCount = 0,
  offline = false,
  onTransition,
}: TaskCardProps) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<ConflictState | null>(null);

  const isOverdue = variant === "overdue";

  async function run(transition: TransitionName, payload?: TransitionPayload) {
    setError(null);
    try {
      const result = await onTransition(task, transition, payload);
      if (result.outcome === "conflict") {
        setConflict({ latestTask: result.task, transition, payload });
        setDialog(null);
      } else {
        setDialog(null);
        setConflict(null);
      }
    } catch (err) {
      setDialog(null);
      setError(err instanceof OfflineError ? err.message : commandErrorMessage(err));
    }
  }

  async function retryWithLatest() {
    if (!conflict) return;
    const { transition, payload } = conflict;
    const latest = conflict.latestTask;
    setConflict(null);
    try {
      const result = await onTransition(latest, transition, payload);
      if (result.outcome === "conflict") {
        setConflict({ latestTask: result.task, transition, payload });
      }
    } catch (err) {
      setError(commandErrorMessage(err));
    }
  }

  return (
    <article
      className={isOverdue ? "task-card overdue" : "task-card"}
      aria-label={`Task: ${task.title}`}
    >
      <header className="task-card-header">
        <div>
          <h3 className="task-title">{task.title}</h3>
          <p className="task-meta">
            <span className="chip chip-category">{CATEGORY_LABELS[task.category]}</span>
            <span className="chip">{task.estimated_minutes} min</span>
            {task.role_tags.map((role) => (
              <span key={role} className="chip chip-role">
                {ROLE_LABELS[role] ?? role}
              </span>
            ))}
            {projectName && <span className="chip chip-project">{projectName}</span>}
            {isOverdue && (
              <span className="chip chip-overdue">
                {`Originally ${task.original_scheduled_date}${
                  rescheduleCount > 0 ? ` - rescheduled ${rescheduleCount}x` : ""
                }`}
              </span>
            )}
          </p>
          <p className="task-state" data-state={task.state}>
            {`${STATE_LABELS[task.state]}${
              task.state === "completed" && task.actual_minutes !== null
                ? ` - ${task.actual_minutes} min actual`
                : ""
            }${task.state === "skipped" && task.skip_reason ? ` - ${task.skip_reason}` : ""}`}
          </p>
        </div>
      </header>

      {task.acceptance_note && <p className="task-acceptance">{task.acceptance_note}</p>}
      {task.evidence_url && (
        <p className="task-evidence">
          Evidence:{" "}
          <a href={task.evidence_url} target="_blank" rel="noopener noreferrer">
            {task.evidence_url}
          </a>
          {task.evidence_note ? ` (${task.evidence_note})` : ""}
        </p>
      )}

      {conflict && (
        <div role="alert" className="task-conflict">
          <p>
            This task changed on another device. Latest state:{" "}
            {STATE_LABELS[conflict.latestTask.state]}.
          </p>
          <div className="task-actions">
            <button type="button" onClick={() => setConflict(null)}>
              Discard my change
            </button>
            <button type="button" onClick={() => void retryWithLatest()}>
              Apply to latest
            </button>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="task-error">
          <p>{error}</p>
        </div>
      )}

      {offline && <p className="task-offline">Offline - changes are disabled (read-only).</p>}

      {dialog === "complete" && (
        <CompleteDialog
          task={task}
          offline={offline}
          onSubmit={(payload) => void run("complete", payload)}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog === "skip" && (
        <SkipDialog
          offline={offline}
          onSubmit={(reason) => void run("skip", { reason })}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog === "reschedule" && (
        <RescheduleDialog
          offline={offline}
          onSubmit={(to_date) => void run("reschedule", { to_date, reason: "manual reschedule" })}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog === "evidence" && (
        <EvidenceDialog
          task={task}
          offline={offline}
          onSubmit={(payload) => void run("edit", payload)}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog === "edit" && (
        <EditTaskDialog
          task={task}
          offline={offline}
          onSubmit={(payload) => void run("edit", payload)}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog === "archive" && (
        <ArchiveDialog
          offline={offline}
          onSubmit={(reason) => void run("archive", { reason })}
          onCancel={() => setDialog(null)}
        />
      )}

      {dialog === null && (
        <div className="task-actions">
          {task.state === "not_started" && (
            <button type="button" disabled={offline} onClick={() => void run("start")}>
              Start
            </button>
          )}
          {(task.state === "not_started" || task.state === "in_progress") && (
            <button type="button" disabled={offline} onClick={() => setDialog("complete")}>
              Complete
            </button>
          )}
          {task.state === "in_progress" && (
            <button
              type="button"
              disabled={offline}
              onClick={() => void run("reopen", { to_state: "not_started" })}
            >
              Stop
            </button>
          )}
          {(task.state === "not_started" || task.state === "in_progress") && (
            <button type="button" disabled={offline} onClick={() => setDialog("reschedule")}>
              Reschedule
            </button>
          )}
          {(task.state === "not_started" || task.state === "in_progress") && (
            <button type="button" disabled={offline} onClick={() => setDialog("skip")}>
              Skip
            </button>
          )}
          {task.state === "completed" && (
            <button
              type="button"
              disabled={offline}
              onClick={() => void run("reopen", { to_state: "in_progress" })}
            >
              Reopen
            </button>
          )}
          {task.state === "skipped" && (
            <button type="button" disabled={offline} onClick={() => void run("reopen")}>
              Reopen
            </button>
          )}
          <button type="button" disabled={offline} onClick={() => setDialog("evidence")}>
            {task.evidence_url || task.evidence_note ? "Edit evidence" : "Add evidence"}
          </button>
          {/* Editing and archiving are custom-task capabilities (section 6.3);
              template tasks must be completed, skipped, or rescheduled. */}
          {task.template_task_key === null &&
            (task.state === "not_started" || task.state === "in_progress") && (
              <button type="button" disabled={offline} onClick={() => setDialog("edit")}>
                Edit task
              </button>
            )}
          {task.template_task_key === null &&
            (task.state === "not_started" || task.state === "in_progress") && (
              <button type="button" disabled={offline} onClick={() => setDialog("archive")}>
                Archive
              </button>
            )}
          <TaskHistory taskId={task.id} />
        </div>
      )}
    </article>
  );
}

/** On-demand immutable event history for this task (section 6.3). */
function TaskHistory({ taskId }: { taskId: string }) {
  const [open, setOpen] = useState(false);
  const { data: events, isLoading } = useTaskEvents(open ? taskId : null);

  return (
    <>
      <button
        type="button"
        className="link-button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "Hide history" : "History"}
      </button>
      {open && (
        <ul className="task-history">
          {isLoading && <li role="status">Loading history…</li>}
          {events?.map((event) => (
            <li key={event.id}>
              <span className="task-history-type">{event.event_type}</span>{" "}
              {new Date(event.occurred_at).toLocaleString("en-CA", { timeZone: "America/Toronto" })}
              {event.event_type === "rescheduled" &&
                ` (${event.from_scheduled_date} -> ${event.to_scheduled_date})`}
              {typeof event.metadata?.reason === "string" && ` - ${event.metadata.reason}`}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function CompleteDialog({
  task,
  offline,
  onSubmit,
  onCancel,
}: {
  task: TaskRow;
  offline: boolean;
  onSubmit: (payload: TransitionPayload) => void;
  onCancel: () => void;
}) {
  const [minutes, setMinutes] = useState(String(task.estimated_minutes));
  const [url, setUrl] = useState(task.evidence_url ?? "");
  const [note, setNote] = useState(task.evidence_note ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const actual = Number(minutes);
    if (!Number.isInteger(actual) || actual <= 0) {
      setValidationError("Actual minutes must be a positive whole number.");
      return;
    }
    if (!isValidHttpsUrl(url)) {
      setValidationError("Evidence links must use HTTPS.");
      return;
    }
    setValidationError(null);
    onSubmit({
      actual_minutes: actual,
      ...(url ? { evidence_url: url } : {}),
      ...(note ? { evidence_note: note } : {}),
    });
  }

  return (
    <form className="task-dialog" onSubmit={submit}>
      <h4>Complete: {task.title}</h4>
      <label htmlFor="complete-minutes">Actual minutes</label>
      <input
        id="complete-minutes"
        type="number"
        step="1"
        value={minutes}
        onChange={(e) => setMinutes(e.target.value)}
        required
      />
      <label htmlFor="complete-url">Evidence link (optional, HTTPS)</label>
      <input
        id="complete-url"
        type="url"
        placeholder="https://"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <label htmlFor="complete-note">Evidence note (optional)</label>
      <input
        id="complete-note"
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      {validationError && (
        <p role="alert" className="task-error-text">
          {validationError}
        </p>
      )}
      <div className="task-actions">
        <button type="submit" disabled={offline}>
          Save completion
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function SkipDialog({
  offline,
  onSubmit,
  onCancel,
}: {
  offline: boolean;
  onSubmit: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState<string>(SKIP_REASONS[0]);
  const [note, setNote] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit(composeSkipReason(reason, note));
  }

  return (
    <form className="task-dialog" onSubmit={submit}>
      <h4>Skip task</h4>
      <label htmlFor="skip-reason">Reason (required)</label>
      <select id="skip-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
        {SKIP_REASONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <label htmlFor="skip-note">Note (optional)</label>
      <input id="skip-note" type="text" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="task-actions">
        <button type="submit" disabled={offline}>
          Skip task
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function RescheduleDialog({
  offline,
  onSubmit,
  onCancel,
}: {
  offline: boolean;
  onSubmit: (toDate: string) => void;
  onCancel: () => void;
}) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Toronto" });
  const [date, setDate] = useState(today);
  const [validationError, setValidationError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (date < today) {
      setValidationError("Choose today or a later date (Toronto time).");
      return;
    }
    setValidationError(null);
    onSubmit(date);
  }

  return (
    <form className="task-dialog" onSubmit={submit}>
      <h4>Reschedule task</h4>
      <label htmlFor="reschedule-date">New date (today or later)</label>
      <input
        id="reschedule-date"
        type="date"
        min={today}
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      {validationError && (
        <p role="alert" className="task-error-text">
          {validationError}
        </p>
      )}
      <div className="task-actions">
        <button type="submit" disabled={offline}>
          Reschedule
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function EvidenceDialog({
  task,
  offline,
  onSubmit,
  onCancel,
}: {
  task: TaskRow;
  offline: boolean;
  onSubmit: (payload: TransitionPayload) => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState(task.evidence_url ?? "");
  const [note, setNote] = useState(task.evidence_note ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!isValidHttpsUrl(url)) {
      setValidationError("Evidence links must use HTTPS.");
      return;
    }
    setValidationError(null);
    onSubmit({
      evidence_url: url || null,
      evidence_note: note || null,
    });
  }

  return (
    <form className="task-dialog" onSubmit={submit}>
      <h4>Evidence: {task.title}</h4>
      <label htmlFor="evidence-url">Evidence link (HTTPS)</label>
      <input
        id="evidence-url"
        type="url"
        placeholder="https://"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <label htmlFor="evidence-note">Evidence note</label>
      <input
        id="evidence-note"
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      {validationError && (
        <p role="alert" className="task-error-text">
          {validationError}
        </p>
      )}
      <div className="task-actions">
        <button type="submit" disabled={offline}>
          Save evidence
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function EditTaskDialog({
  task,
  offline,
  onSubmit,
  onCancel,
}: {
  task: TaskRow;
  offline: boolean;
  onSubmit: (payload: TransitionPayload) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [minutes, setMinutes] = useState(String(task.estimated_minutes));
  const [category, setCategory] = useState(task.category);
  const [description, setDescription] = useState(task.description ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);

  function submit(event: FormEvent) {
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
    onSubmit({
      title: trimmed,
      estimated_minutes: estimated,
      category,
      description: description.trim() || null,
    });
  }

  return (
    <form className="task-dialog" onSubmit={submit}>
      <h4>Edit custom task</h4>
      <label htmlFor="edit-title">Title</label>
      <input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <label htmlFor="edit-category">Category</label>
      <select
        id="edit-category"
        value={category}
        onChange={(e) => setCategory(e.target.value as TaskRow["category"])}
      >
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <label htmlFor="edit-minutes">Estimated minutes</label>
      <input
        id="edit-minutes"
        type="number"
        value={minutes}
        onChange={(e) => setMinutes(e.target.value)}
      />
      <label htmlFor="edit-description">Description</label>
      <input
        id="edit-description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      {validationError && (
        <p role="alert" className="task-error-text">
          {validationError}
        </p>
      )}
      <div className="task-actions">
        <button type="submit" disabled={offline}>
          Save changes
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function ArchiveDialog({
  offline,
  onSubmit,
  onCancel,
}: {
  offline: boolean;
  onSubmit: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!reason.trim()) {
      setValidationError("An archive reason is required.");
      return;
    }
    setValidationError(null);
    onSubmit(reason.trim());
  }

  return (
    <form className="task-dialog" onSubmit={submit}>
      <h4>Archive custom task</h4>
      <p className="overdue-note">
        Archiving removes the task from active planning. It counts as a non-completion and never
        re-enters a completed metric.
      </p>
      <label htmlFor="archive-reason">Reason (required)</label>
      <input id="archive-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
      {validationError && (
        <p role="alert" className="task-error-text">
          {validationError}
        </p>
      )}
      <div className="task-actions">
        <button type="submit" disabled={offline}>
          Archive task
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
