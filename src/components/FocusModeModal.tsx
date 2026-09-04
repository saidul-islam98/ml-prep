import { useEffect, useRef, useState, useCallback } from "react";
import type { CurriculumTask } from "../curriculum/schemas";
import type { TaskExecutionProgressInput } from "../lib/api";
import { elapsedSeconds, emptyTaskExecution, pauseExecution } from "../hooks/useTaskExecution";
import { useModalFocus } from "../hooks/useModalFocus";
import { Badge, Button } from "./ui";

interface FocusModeModalProps {
  task: CurriculumTask;
  isOpen: boolean;
  onClose: () => void;
  onCompleteTask: (task: CurriculumTask) => void;
  progress?: TaskExecutionProgressInput;
  onProgressChange?: (progress: TaskExecutionProgressInput) => void | Promise<unknown>;
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

// ---------------------------------------------------------------------------
// Serial save queue
// Ensures only one Supabase write is inflight at a time. A new enqueue()
// cancels any pending call, so rapid changes collapse to a single write and
// slow / out-of-order responses can never overwrite newer state.
// ---------------------------------------------------------------------------
function makeSerialQueue() {
  // The promise returned by the last enqueued call.
  let tail: Promise<void> = Promise.resolve();

  function enqueue(fn: () => Promise<void>): Promise<void> {
    // Chain onto tail so each write waits for the previous one to settle.
    tail = tail
      .then(() => fn())
      .catch(() => {
        /* individual call site handles its own errors */
      });
    return tail;
  }

  return { enqueue };
}

export function FocusModeModal({
  task,
  isOpen,
  onClose,
  onCompleteTask,
  progress: controlledProgress,
  onProgressChange,
}: FocusModeModalProps) {
  // Authoritative local draft — updated synchronously on every keystroke.
  const [localProgress, setLocalProgress] = useState<TaskExecutionProgressInput>(() =>
    emptyTaskExecution(),
  );
  const [now, setNow] = useState(Date.now());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // Track mounted status to avoid state updates after unmount.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const localProgressRef = useRef(localProgress);
  useEffect(() => {
    localProgressRef.current = localProgress;
  });

  // Keep latest callback in a ref so queue closures always see the current one.
  const onProgressChangeRef = useRef(onProgressChange);
  useEffect(() => {
    onProgressChangeRef.current = onProgressChange;
  });

  // Serial queue: one write inflight at a time, newest wins.
  const queue = useRef(makeSerialQueue());

  const debouncedPersistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --------------------------------------------------------------------------
  // persistNow: immediately enqueue a write, update save-status UI.
  // The queue guarantees arrival order regardless of network latency.
  // --------------------------------------------------------------------------
  const persistNow = useCallback((next: TaskExecutionProgressInput): Promise<void> => {
    if (!onProgressChangeRef.current) return Promise.resolve();
    if (mountedRef.current) setSaveStatus("saving");
    return queue.current.enqueue(async () => {
      try {
        await onProgressChangeRef.current!(next);
        if (mountedRef.current) {
          setSaveStatus("saved");
          setTimeout(() => {
            if (mountedRef.current) setSaveStatus((s) => (s === "saved" ? "idle" : s));
          }, 2000);
        }
      } catch {
        if (mountedRef.current) setSaveStatus("error");
        // Do NOT discard the local draft — it is still in localProgress.
      }
    });
  }, []);

  // --------------------------------------------------------------------------
  // save: apply locally, then persist (debounced or immediate).
  // --------------------------------------------------------------------------
  function save(next: TaskExecutionProgressInput, immediate = false) {
    setLocalProgress(next);
    if (debouncedPersistTimer.current) clearTimeout(debouncedPersistTimer.current);
    if (immediate) {
      void persistNow(next);
    } else {
      debouncedPersistTimer.current = setTimeout(() => void persistNow(next), 500);
    }
  }

  // --------------------------------------------------------------------------
  // Lifecycle: open auto-resumes timer; close flushes notes and pauses.
  // --------------------------------------------------------------------------
  const prevIsOpen = useRef(false);
  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      const ts = new Date().toISOString();
      const base = controlledProgress ?? localProgressRef.current;
      const resumed: TaskExecutionProgressInput = {
        ...base,
        started_at: base.started_at ?? ts,
        timer_started_at: base.timer_started_at ?? ts,
        paused_at: base.timer_started_at ? base.paused_at : null,
      };
      setLocalProgress(resumed);
      void persistNow(resumed);
    } else if (!isOpen && prevIsOpen.current) {
      // Modal just closed: flush pending debounce and pause timer if still running
      if (debouncedPersistTimer.current) {
        clearTimeout(debouncedPersistTimer.current);
        debouncedPersistTimer.current = null;
        void persistNow(localProgressRef.current);
      }
      if (localProgressRef.current.timer_started_at) {
        const paused = pauseExecution(localProgressRef.current);
        setLocalProgress(paused);
        void persistNow(paused);
      }
    } else if (!isOpen && controlledProgress) {
      // Keep local draft in sync with external updates while closed
      setLocalProgress(controlledProgress);
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, controlledProgress, persistNow]);

  // --------------------------------------------------------------------------
  // pauseAndClose: flush debounce, pause the timer, persist, then close.
  // Passed to useModalFocus so Escape calls this path, not the raw onClose.
  // --------------------------------------------------------------------------
  const pauseAndCloseRef = useRef<() => void>(() => {
    /* filled below */
  });

  // We define pauseAndClose as a ref-stable wrapper so useModalFocus can
  // always call the current version without a stale closure.
  const dialogRef = useModalFocus<HTMLDivElement>(isOpen, () => pauseAndCloseRef.current());

  // --------------------------------------------------------------------------
  // Timer tick
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen || !localProgress.timer_started_at) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [isOpen, localProgress.timer_started_at]);

  // ──────────────────────────────────────────────────────────────────────────
  // Render-time variables (only reached when isOpen)
  // ──────────────────────────────────────────────────────────────────────────
  if (!isOpen) return null;

  const totalSteps = task.todos.length;
  const currentStepIndex = Math.min(localProgress.current_step_index, Math.max(0, totalSteps - 1));
  const currentStep = task.todos[currentStepIndex];
  const shownSeconds = elapsedSeconds(localProgress, now);
  const completed = currentStep ? localProgress.completed_todo_ids.includes(currentStep.id) : false;

  // Define the real pauseAndClose and wire it into the ref.
  function pauseAndClose() {
    if (debouncedPersistTimer.current) {
      clearTimeout(debouncedPersistTimer.current);
      debouncedPersistTimer.current = null;
    }
    const paused = pauseExecution(localProgress);
    setLocalProgress(paused);
    void persistNow(paused);
    onClose();
  }
  pauseAndCloseRef.current = pauseAndClose;

  function toggleTimer() {
    if (localProgress.timer_started_at) {
      save(pauseExecution(localProgress), true);
    } else {
      save({ ...localProgress, timer_started_at: new Date().toISOString(), paused_at: null }, true);
      setNow(Date.now());
    }
  }

  function move(index: number) {
    if (debouncedPersistTimer.current) {
      clearTimeout(debouncedPersistTimer.current);
      debouncedPersistTimer.current = null;
    }
    save(
      { ...localProgress, current_step_index: Math.max(0, Math.min(totalSteps - 1, index)) },
      true,
    );
  }

  function markCurrentStepDone() {
    if (!currentStep) return;
    const ids = Array.from(new Set([...localProgress.completed_todo_ids, currentStep.id]));
    save(
      {
        ...localProgress,
        completed_todo_ids: ids,
        current_step_index: Math.min(totalSteps - 1, currentStepIndex + 1),
      },
      true,
    );
  }

  function recordResource(resourceId: string) {
    save({
      ...localProgress,
      opened_resource_ids: Array.from(new Set([...localProgress.opened_resource_ids, resourceId])),
    });
  }

  const saveLabel: Record<SaveStatus, string | null> = {
    idle: null,
    saving: "Saving\u2026",
    saved: "Saved",
    error: "Save failed",
  };

  return (
    <div
      className="deepml-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="focus-modal-title"
      onClick={pauseAndClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="deepml-modal-card deepml-focus-card"
        onClick={(event) => event.stopPropagation()}
      >
        {/* ── Header (sticky) ── */}
        <div className="deepml-focus-header">
          <div className="deepml-focus-header-info">
            <div className="deepml-modal-eyebrow">
              <Badge tone="accent">Focus Execution</Badge>
              <Badge tone="neutral">Week {task.week}</Badge>
              <span className="deepml-pill--sm deepml-footer-meta">
                Step {currentStepIndex + 1} of {totalSteps}
              </span>
            </div>
            <h2 id="focus-modal-title" className="deepml-focus-title">
              {task.title}
            </h2>
          </div>
          <div className="deepml-focus-header-right">
            <div className="deepml-focus-timer-box">
              <div className="deepml-focus-timer-digits" aria-live="off">
                {formatTime(shownSeconds)}
              </div>
              <div className="deepml-focus-timer-controls">
                <Button
                  variant="ghost"
                  onClick={toggleTimer}
                  aria-label={localProgress.timer_started_at ? "Pause Timer" : "Resume Timer"}
                >
                  {localProgress.timer_started_at ? "Pause" : "Resume"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    save(
                      {
                        ...localProgress,
                        elapsed_seconds: 0,
                        timer_started_at: localProgress.timer_started_at
                          ? new Date().toISOString()
                          : null,
                      },
                      true,
                    )
                  }
                  aria-label="Reset Timer"
                >
                  Reset
                </Button>
              </div>
            </div>
            {/* ── Close button ── */}
            <button
              type="button"
              className="deepml-modal-close deepml-focus-close"
              aria-label="Exit focus mode"
              onClick={pauseAndClose}
            >
              &times;
            </button>
          </div>
        </div>

        <div className="deepml-focus-progress-track">
          <div
            className="deepml-focus-progress-fill"
            style={{ width: `${totalSteps ? ((currentStepIndex + 1) / totalSteps) * 100 : 0}%` }}
          />
        </div>

        {/* ── Scrollable body ── */}
        <div className="deepml-modal-body deepml-focus-body">
          {currentStep ? (
            <div className="deepml-focus-step-card">
              <div className="deepml-focus-step-header">
                <span className="deepml-focus-step-num">Step {currentStepIndex + 1}</span>
                {currentStep.estimatedMinutes && (
                  <Badge tone="role-agent-env">Budget: {currentStep.estimatedMinutes} min</Badge>
                )}
                {completed && <Badge tone="success">Step Completed</Badge>}
              </div>
              <h3 className="deepml-focus-step-text">{currentStep.text}</h3>
              {currentStep.output && (
                <div className="deepml-focus-step-output">
                  <strong>Target Output:</strong> <code>{currentStep.output}</code>
                </div>
              )}
              {task.resources?.length ? (
                <div className="deepml-focus-resources-preview">
                  <span className="deepml-resource-heading">Targeted Reading / Tool:</span>
                  <div className="deepml-resource-pills">
                    {task.resources.map((resource) => (
                      <a
                        key={resource.id}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="deepml-resource-pill-link"
                        onClick={() => recordResource(resource.id)}
                      >
                        {resource.title} - open
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="deepml-focus-notes-area">
                <label htmlFor={`step-notes-${task.key}`} className="deepml-label">
                  Execution Notes / Output Log:
                  {saveLabel[saveStatus] && (
                    <span className="deepml-focus-save-status" aria-live="polite">
                      {" "}
                      {saveLabel[saveStatus]}
                    </span>
                  )}
                </label>
                <textarea
                  id={`step-notes-${task.key}`}
                  className="deepml-textarea"
                  rows={4}
                  placeholder="Record findings, complexity, test results, or error causes..."
                  value={localProgress.step_notes[currentStep.id] ?? ""}
                  onChange={(event) =>
                    save({
                      ...localProgress,
                      step_notes: {
                        ...localProgress.step_notes,
                        [currentStep.id]: event.target.value,
                      },
                    })
                  }
                  onBlur={() => {
                    if (debouncedPersistTimer.current) {
                      clearTimeout(debouncedPersistTimer.current);
                      debouncedPersistTimer.current = null;
                      void persistNow(localProgress);
                    }
                  }}
                />
              </div>
            </div>
          ) : (
            <p>All steps completed.</p>
          )}
        </div>

        {/* ── Footer (sticky) ── */}
        <div className="deepml-modal-footer deepml-focus-footer">
          <div className="deepml-focus-nav-left">
            <Button
              variant="ghost"
              disabled={currentStepIndex === 0}
              onClick={() => move(currentStepIndex - 1)}
            >
              Previous Step
            </Button>
            <Button
              variant="ghost"
              disabled={currentStepIndex >= totalSteps - 1}
              onClick={() => move(currentStepIndex + 1)}
            >
              Next Step
            </Button>
          </div>
          <div className="deepml-focus-nav-right">
            <Button variant="secondary" onClick={pauseAndClose}>
              Exit Focus
            </Button>
            <Button variant="primary" onClick={markCurrentStepDone}>
              {currentStepIndex < totalSteps - 1 ? "Complete Step & Next" : "Finish Last Step"}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (debouncedPersistTimer.current) {
                  clearTimeout(debouncedPersistTimer.current);
                  debouncedPersistTimer.current = null;
                }
                const paused = pauseExecution(localProgress);
                void persistNow(paused);
                onClose();
                onCompleteTask(task);
              }}
            >
              Finish &amp; Mark Complete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
