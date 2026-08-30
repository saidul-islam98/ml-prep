import React, { useState, useEffect } from "react";
import type { CurriculumTask } from "../curriculum/schemas";
import { Badge, Button } from "./ui";

interface FocusModeModalProps {
  task: CurriculumTask;
  isOpen: boolean;
  onClose: () => void;
  onCompleteTask: (task: CurriculumTask) => void;
}

export const FocusModeModal: React.FC<FocusModeModalProps> = ({
  task,
  isOpen,
  onClose,
  onCompleteTask,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [stepNotes, setStepNotes] = useState<Record<string, string>>({});
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !isTimerRunning) return;
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isTimerRunning]);

  if (!isOpen) return null;

  const totalSteps = task.todos.length;
  const currentStep = task.todos[currentStepIndex];

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const markCurrentStepDone = () => {
    if (currentStep) {
      setCompletedSteps((prev) => ({ ...prev, [currentStep.id]: true }));
    }
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  return (
    <div
      className="deepml-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="focus-modal-title"
      onClick={onClose}
    >
      <div className="deepml-modal-card deepml-focus-card" onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
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

          {/* Timer Display */}
          <div className="deepml-focus-timer-box">
            <div className="deepml-focus-timer-digits">{formatTime(secondsElapsed)}</div>
            <div className="deepml-focus-timer-controls">
              <Button
                variant="ghost"
                onClick={() => setIsTimerRunning((r) => !r)}
                aria-label={isTimerRunning ? "Pause Timer" : "Resume Timer"}
              >
                {isTimerRunning ? "⏸ Pause" : "▶ Resume"}
              </Button>
              <Button variant="ghost" onClick={() => setSecondsElapsed(0)} aria-label="Reset Timer">
                ↺ Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="deepml-focus-progress-track">
          <div
            className="deepml-focus-progress-fill"
            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Body / Current Step */}
        <div className="deepml-modal-body deepml-focus-body">
          {currentStep ? (
            <div className="deepml-focus-step-card">
              <div className="deepml-focus-step-header">
                <span className="deepml-focus-step-num">Step {currentStepIndex + 1}</span>
                {currentStep.estimatedMinutes && (
                  <Badge tone="role-agent-env">Budget: {currentStep.estimatedMinutes} min</Badge>
                )}
                {completedSteps[currentStep.id] && <Badge tone="success">✓ Step Completed</Badge>}
              </div>

              <h3 className="deepml-focus-step-text">{currentStep.text}</h3>

              {currentStep.output && (
                <div className="deepml-focus-step-output">
                  <strong>Target Output:</strong> <code>{currentStep.output}</code>
                </div>
              )}

              {/* Task Resources */}
              {task.resources && task.resources.length > 0 && (
                <div className="deepml-focus-resources-preview">
                  <span className="deepml-resource-heading">Targeted Reading / Tool:</span>
                  <div className="deepml-resource-pills">
                    {task.resources.map((res) => (
                      <a
                        key={res.id}
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="deepml-resource-pill-link"
                      >
                        📖 {res.title} ↗
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes / Evidence workspace */}
              <div className="deepml-focus-notes-area">
                <label htmlFor="step-notes" className="deepml-label">
                  Execution Notes / Output Log:
                </label>
                <textarea
                  id="step-notes"
                  className="deepml-textarea"
                  rows={4}
                  placeholder="Record findings, complexity derivation, code snippets, or error causes..."
                  value={stepNotes[currentStep.id] || ""}
                  onChange={(e) =>
                    setStepNotes((prev) => ({
                      ...prev,
                      [currentStep.id]: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          ) : (
            <p>All steps completed!</p>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="deepml-modal-footer deepml-focus-footer">
          <div className="deepml-focus-nav-left">
            <Button
              variant="ghost"
              disabled={currentStepIndex === 0}
              onClick={() => setCurrentStepIndex((i) => Math.max(0, i - 1))}
            >
              ← Previous Step
            </Button>
            <Button
              variant="ghost"
              disabled={currentStepIndex >= totalSteps - 1}
              onClick={() => setCurrentStepIndex((i) => Math.min(totalSteps - 1, i + 1))}
            >
              Next Step →
            </Button>
          </div>

          <div className="deepml-focus-nav-right">
            <Button variant="secondary" onClick={onClose}>
              Exit Focus
            </Button>
            <Button variant="primary" onClick={markCurrentStepDone}>
              {currentStepIndex < totalSteps - 1 ? "✓ Complete Step & Next" : "✓ Finish Last Step"}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
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
};
