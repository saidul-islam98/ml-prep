/**
 * Task card (Task UI-4): state, estimate, role/project context, and the next
 * action are immediately clear; secondary actions live in an accessible
 * overflow menu. Every action routes through the audited RPC with the
 * last-seen revision; conflicts and failures surface inline.
 */

import { useState, type FormEvent } from "react";
import type { TaskRow, TransitionName, TransitionOutcome, TransitionPayload } from "../lib/api";
import { OfflineError } from "../lib/api";
import { useTaskEvents } from "../hooks/useTasks";
import { useTaskExecution } from "../hooks/useTaskExecution";
import {
  CATEGORY_LABELS,
  ROLE_LABELS,
  SKIP_REASONS,
  composeSkipReason,
  commandErrorMessage,
  isValidHttpsUrl,
} from "../lib/constants";
import { Badge, Button, Menu, type BadgeTone, type MenuItem } from "./ui";
import {
  cardVariantClass,
  menuItems,
  primaryAction,
  secondaryAction,
  type TaskActionContext,
  type TaskDialog,
} from "./TaskActionMenu";
import { getCurriculumTask } from "../curriculum";
import { TaskDetailModal } from "./TaskDetailModal";
import { FocusModeModal } from "./FocusModeModal";
import { CompletionGateModal } from "./CompletionGateModal";

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
  const [historyOpen, setHistoryOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);

  const isOverdue = variant === "overdue";
  const curriculumTask =
    getCurriculumTask(task.template_task_key ?? "") || getCurriculumTask(task.id);
  const { progress, saveProgress } = useTaskExecution(task.id);

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
        return true;
      }
    } catch (err) {
      setDialog(null);
      setError(err instanceof OfflineError ? err.message : commandErrorMessage(err));
    }
    return false;
  }

  async function startFocus() {
    if (task.state === "completed" || task.state === "archived" || task.state === "skipped") return;
    if (task.state === "not_started" && !(await run("start"))) return;
    setFocusOpen(true);
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

  const ctx: TaskActionContext = {
    task,
    run: (transition, payload) => void run(transition, payload),
    openDialog: (d: TaskDialog) => {
      if (d === "complete" && curriculumTask) setGateOpen(true);
      else setDialog(d);
    },
    toggleHistory: () => setHistoryOpen((o) => !o),
    historyOpen,
    offline,
  };

  const primary = primaryAction(ctx);
  const secondary = secondaryAction(ctx);
  const items: MenuItem[] = menuItems(ctx);

  return (
    <article className={cardVariantClass(task, isOverdue)} aria-label={`Task: ${task.title}`}>
      <header className="task-card__head">
        <span className="task-dot" data-state={task.state} aria-hidden="true" />
        <h3 className="task-title">{task.title}</h3>
        <Badge
          tone={
            task.state === "completed"
              ? "success"
              : task.state === "in_progress"
                ? "accent"
                : isOverdue
                  ? "warning"
                  : "neutral"
          }
        >
          {isOverdue ? "Overdue" : stateLabel(task.state)}
        </Badge>
      </header>

      <p className="task-meta ui-chip-row">
        <Badge>{CATEGORY_LABELS[task.category]}</Badge>
        <Badge>{task.estimated_minutes} min</Badge>
        {task.role_tags.map((role) => {
          const tone: BadgeTone =
            role === "post_training"
              ? "role-post-training"
              : role === "data_eval"
                ? "role-data-eval"
                : role === "agent_env"
                  ? "role-agent-env"
                  : "neutral";
          return (
            <Badge key={role} tone={tone}>
              {ROLE_LABELS[role] ?? role}
            </Badge>
          );
        })}
        {projectName && <Badge>{projectName}</Badge>}
        {isOverdue && (
          <Badge tone="warning">
            {`Originally ${task.original_scheduled_date}${
              rescheduleCount > 0 ? ` - rescheduled ${rescheduleCount}x` : ""
            }`}
          </Badge>
        )}
      </p>

      {curriculumTask && (
        <div className="task-curriculum-chips ui-chip-row">
          <Badge tone="neutral">⚡ {curriculumTask.todos.length} steps</Badge>
          {curriculumTask.resources && curriculumTask.resources.length > 0 && (
            <Badge tone="neutral">📖 {curriculumTask.resources.length} resources</Badge>
          )}
          {curriculumTask.deliverables && curriculumTask.deliverables.length > 0 && (
            <Badge tone="neutral">📦 {curriculumTask.deliverables.length} artifact</Badge>
          )}
        </div>
      )}

      {task.acceptance_note && <p className="task-acceptance">{task.acceptance_note}</p>}
      {task.evidence_url && (
        <p className="task-evidence">
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
            {stateLabel(conflict.latestTask.state)}.
          </p>
          <div className="task-actions">
            <Button small onClick={() => setConflict(null)}>
              Discard my change
            </Button>
            <Button small variant="primary" onClick={() => void retryWithLatest()}>
              Apply to latest
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="task-error">
          <p>{error}</p>
        </div>
      )}

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

      <div className="task-actions">
        {curriculumTask && (
          <>
            <Button
              small
              variant="ghost"
              onClick={() => setDetailOpen(true)}
              aria-label={`Open details for ${task.title}`}
            >
              Details ↗
            </Button>
            <Button
              small
              variant="ghost"
              onClick={() => void startFocus()}
              aria-label={`Launch focus mode for ${task.title}`}
            >
              ⏱ Focus
            </Button>
          </>
        )}
        {primary && (
          <Button variant="primary" disabled={offline} onClick={primary.run}>
            {primary.label}
          </Button>
        )}
        {secondary && (
          <Button disabled={offline} onClick={secondary.run}>
            {secondary.label}
          </Button>
        )}
        <Menu triggerLabel={`More actions for ${task.title}`} items={items} />
      </div>

      {curriculumTask && detailOpen && (
        <TaskDetailModal
          task={curriculumTask}
          isOpen={detailOpen}
          isCompleted={task.state === "completed"}
          onClose={() => setDetailOpen(false)}
          progress={progress}
          onProgressChange={saveProgress}
          onStartFocus={() => {
            setDetailOpen(false);
            void startFocus();
          }}
          onComplete={() => {
            setDetailOpen(false);
            setGateOpen(true);
          }}
        />
      )}

      {curriculumTask && focusOpen && (
        <FocusModeModal
          task={curriculumTask}
          isOpen={focusOpen}
          onClose={() => setFocusOpen(false)}
          progress={progress}
          onProgressChange={saveProgress}
          onCompleteTask={() => {
            setFocusOpen(false);
            setGateOpen(true);
          }}
        />
      )}

      {curriculumTask && gateOpen && (
        <CompletionGateModal
          task={curriculumTask}
          isOpen={gateOpen}
          onClose={() => setGateOpen(false)}
          progress={progress}
          onProgressChange={saveProgress}
          initialEvidenceUrl={task.evidence_url}
          initialEvidenceNote={task.evidence_note}
          estimatedMinutes={task.estimated_minutes}
          onConfirmComplete={(_t, result) => {
            setGateOpen(false);
            void run("complete", {
              actual_minutes: result.actualMinutes,
              evidence_url: result.evidenceUrl,
              evidence_note: result.evidenceNote,
              completion_gate_verified: !result.overrideReason,
              completion_override_reason: result.overrideReason,
              completed_criterion_ids: result.completedCriterionIds,
              elapsed_seconds: result.elapsedSeconds,
            });
          }}
        />
      )}

      <TaskHistory taskId={task.id} open={historyOpen} onToggle={() => setHistoryOpen((o) => !o)} />
    </article>
  );
}

function stateLabel(state: TaskRow["state"]): string {
  return state.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** On-demand immutable event history (WEBAPP_SPEC.md section 6.3). */
function TaskHistory({
  taskId,
  open,
  onToggle,
}: {
  taskId: string;
  open: boolean;
  onToggle: () => void;
}) {
  const { data: events, isLoading } = useTaskEvents(open ? taskId : null);

  return (
    <>
      <button
        type="button"
        className="ui-disclosure-toggle"
        aria-expanded={open}
        onClick={onToggle}
      >
        {open ? "Hide history" : "History"}
      </button>
      {open ? (
        <ul className="task-history">
          {isLoading && <li role="status">Loading history…</li>}
          {events?.map((event) => (
            <li key={event.id}>
              <span className="task-history-type">{event.event_type}</span>{" "}
              {new Date(event.occurred_at).toLocaleString("en-CA", {
                timeZone: "America/Toronto",
              })}
              {event.event_type === "rescheduled" &&
                ` (${event.from_scheduled_date} -> ${event.to_scheduled_date})`}
              {typeof event.metadata?.reason === "string" && ` - ${event.metadata.reason}`}
              {typeof event.metadata?.completion_override_reason === "string" &&
                ` - Completion override: ${event.metadata.completion_override_reason}`}
              {typeof event.metadata?.elapsed_seconds === "number" &&
                ` - Focus time: ${Math.ceil(event.metadata.elapsed_seconds / 60)} min`}
            </li>
          ))}
        </ul>
      ) : null}
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
        className="ui-input"
        type="number"
        step="1"
        value={minutes}
        onChange={(e) => setMinutes(e.target.value)}
        required
      />
      <label htmlFor="complete-url">Evidence link (optional, HTTPS)</label>
      <input
        id="complete-url"
        className="ui-input"
        type="url"
        placeholder="https://"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <label htmlFor="complete-note">Evidence note (optional)</label>
      <input
        id="complete-note"
        className="ui-input"
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
        <Button variant="primary" type="submit" disabled={offline}>
          Save completion
        </Button>
        <Button onClick={onCancel}>Cancel</Button>
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
      <select
        id="skip-reason"
        className="ui-select"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      >
        {SKIP_REASONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <label htmlFor="skip-note">Note (optional)</label>
      <input
        id="skip-note"
        className="ui-input"
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="task-actions">
        <Button variant="primary" type="submit" disabled={offline}>
          Skip task
        </Button>
        <Button onClick={onCancel}>Cancel</Button>
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
        className="ui-input"
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
        <Button variant="primary" type="submit" disabled={offline}>
          Reschedule
        </Button>
        <Button onClick={onCancel}>Cancel</Button>
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
        className="ui-input"
        type="url"
        placeholder="https://"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <label htmlFor="evidence-note">Evidence note</label>
      <input
        id="evidence-note"
        className="ui-input"
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
        <Button variant="primary" type="submit" disabled={offline}>
          Save evidence
        </Button>
        <Button onClick={onCancel}>Cancel</Button>
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
      <input
        id="edit-title"
        className="ui-input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <label htmlFor="edit-category">Category</label>
      <select
        id="edit-category"
        className="ui-select"
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
        className="ui-input"
        type="number"
        value={minutes}
        onChange={(e) => setMinutes(e.target.value)}
      />
      <label htmlFor="edit-description">Description</label>
      <input
        id="edit-description"
        className="ui-input"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      {validationError && (
        <p role="alert" className="task-error-text">
          {validationError}
        </p>
      )}
      <div className="task-actions">
        <Button variant="primary" type="submit" disabled={offline}>
          Save changes
        </Button>
        <Button onClick={onCancel}>Cancel</Button>
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
      <input
        id="archive-reason"
        className="ui-input"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      {validationError && (
        <p role="alert" className="task-error-text">
          {validationError}
        </p>
      )}
      <div className="task-actions">
        <Button variant="primary" type="submit" disabled={offline}>
          Archive task
        </Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
