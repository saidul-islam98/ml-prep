import { useEffect, useState } from "react";
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

export function FocusModeModal({
  task,
  isOpen,
  onClose,
  onCompleteTask,
  progress: controlledProgress,
  onProgressChange,
}: FocusModeModalProps) {
  const [localProgress, setLocalProgress] = useState<TaskExecutionProgressInput>(() => ({
    ...emptyTaskExecution(),
    timer_started_at: new Date().toISOString(),
    started_at: new Date().toISOString(),
  }));
  const [now, setNow] = useState(Date.now());
  const progress = controlledProgress ?? localProgress;
  const dialogRef = useModalFocus<HTMLDivElement>(isOpen, onClose);

  function save(next: TaskExecutionProgressInput) {
    if (!controlledProgress) setLocalProgress(next);
    void onProgressChange?.(next);
  }

  useEffect(() => {
    if (!isOpen || !progress.timer_started_at) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [isOpen, progress.timer_started_at]);

  useEffect(() => {
    if (!isOpen || progress.started_at) return;
    const started = new Date().toISOString();
    save({ ...progress, started_at: started, timer_started_at: started });
  }, [isOpen, progress.started_at]);

  if (!isOpen) return null;

  const totalSteps = task.todos.length;
  const currentStepIndex = Math.min(progress.current_step_index, Math.max(0, totalSteps - 1));
  const currentStep = task.todos[currentStepIndex];
  const shownSeconds = elapsedSeconds(progress, now);
  const completed = currentStep ? progress.completed_todo_ids.includes(currentStep.id) : false;

  function pauseAndClose() {
    save(pauseExecution(progress));
    onClose();
  }

  function toggleTimer() {
    if (progress.timer_started_at) {
      save(pauseExecution(progress));
    } else {
      save({ ...progress, timer_started_at: new Date().toISOString(), paused_at: null });
      setNow(Date.now());
    }
  }

  function move(index: number) {
    save({ ...progress, current_step_index: Math.max(0, Math.min(totalSteps - 1, index)) });
  }

  function markCurrentStepDone() {
    if (!currentStep) return;
    const ids = Array.from(new Set([...progress.completed_todo_ids, currentStep.id]));
    save({
      ...progress,
      completed_todo_ids: ids,
      current_step_index: Math.min(totalSteps - 1, currentStepIndex + 1),
    });
  }

  function recordResource(resourceId: string) {
    save({
      ...progress,
      opened_resource_ids: Array.from(new Set([...progress.opened_resource_ids, resourceId])),
    });
  }

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
          <div className="deepml-focus-timer-box">
            <div className="deepml-focus-timer-digits" aria-live="off">
              {formatTime(shownSeconds)}
            </div>
            <div className="deepml-focus-timer-controls">
              <Button
                variant="ghost"
                onClick={toggleTimer}
                aria-label={progress.timer_started_at ? "Pause Timer" : "Resume Timer"}
              >
                {progress.timer_started_at ? "Pause" : "Resume"}
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  save({
                    ...progress,
                    elapsed_seconds: 0,
                    timer_started_at: progress.timer_started_at ? new Date().toISOString() : null,
                  })
                }
                aria-label="Reset Timer"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>

        <div className="deepml-focus-progress-track">
          <div
            className="deepml-focus-progress-fill"
            style={{ width: `${totalSteps ? ((currentStepIndex + 1) / totalSteps) * 100 : 0}%` }}
          />
        </div>

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
                </label>
                <textarea
                  id={`step-notes-${task.key}`}
                  className="deepml-textarea"
                  rows={4}
                  placeholder="Record findings, complexity, test results, or error causes..."
                  value={progress.step_notes[currentStep.id] ?? ""}
                  onChange={(event) =>
                    save({
                      ...progress,
                      step_notes: { ...progress.step_notes, [currentStep.id]: event.target.value },
                    })
                  }
                />
              </div>
            </div>
          ) : (
            <p>All steps completed.</p>
          )}
        </div>

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
                save(pauseExecution(progress));
                onClose();
                onCompleteTask(task);
              }}
            >
              Finish & Mark Complete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
