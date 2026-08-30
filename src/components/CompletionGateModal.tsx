import React, { useState, useEffect } from "react";
import type { CurriculumTask } from "../curriculum/schemas";
import { Badge, Button } from "./ui";

interface CompletionGateModalProps {
  task: CurriculumTask;
  isOpen: boolean;
  onClose: () => void;
  onConfirmComplete: (task: CurriculumTask, overrideRationale?: string) => void;
}

export const CompletionGateModal: React.FC<CompletionGateModalProps> = ({
  task,
  isOpen,
  onClose,
  onConfirmComplete,
}) => {
  const [checkedCriteria, setCheckedCriteria] = useState<Record<string, boolean>>({});
  const [overrideRationale, setOverrideRationale] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const requiredCriteria = task.completionCriteria.filter((c) => c.required);
  const allRequiredChecked = requiredCriteria.every((c) => checkedCriteria[c.id]);

  const toggleCriterion = (id: string) => {
    setCheckedCriteria((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleConfirm = () => {
    if (allRequiredChecked) {
      onConfirmComplete(task);
    } else {
      if (!overrideRationale.trim()) {
        return;
      }
      onConfirmComplete(task, overrideRationale.trim());
    }
    onClose();
  };

  return (
    <div
      className="deepml-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-modal-title"
      onClick={onClose}
    >
      <div className="deepml-modal-card deepml-gate-card" onClick={(e) => e.stopPropagation()}>
        <div className="deepml-modal-header">
          <div>
            <div className="deepml-modal-eyebrow">
              <Badge tone="accent">Completion Gate</Badge>
              <Badge tone="neutral">Week {task.week}</Badge>
            </div>
            <h2 id="gate-modal-title" className="deepml-modal-title">
              Verify Definition of Done
            </h2>
            <p className="deepml-task-summary">
              Confirm that all required deliverables and verification checks exist for{" "}
              <strong>{task.title}</strong>.
            </p>
          </div>
          <button
            type="button"
            className="deepml-modal-close"
            onClick={onClose}
            aria-label="Close gate dialog"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <div className="deepml-modal-body deepml-gate-body">
          <div className="deepml-checklist">
            {task.completionCriteria.map((crit) => (
              <label
                key={crit.id}
                className={`deepml-checklist-item ${checkedCriteria[crit.id] ? "is-checked" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={!!checkedCriteria[crit.id]}
                  onChange={() => toggleCriterion(crit.id)}
                />
                <div className="deepml-checklist-content">
                  <span>{crit.text}</span>
                  {crit.required && <Badge tone="warning">Required Gate</Badge>}
                </div>
              </label>
            ))}
          </div>

          {!allRequiredChecked && (
            <div className="deepml-gate-warning-box">
              <div className="deepml-gate-warning-title">
                ⚠️ Some required criteria are not checked
              </div>
              <p>
                To maintain interview-defensible proof, tasks should only be marked complete when
                all gates are met. If you have an alternative proof or equivalent work, provide an
                explicit override justification below:
              </p>
              <textarea
                className="deepml-textarea"
                rows={3}
                placeholder="Required override rationale (e.g. 'Completed equivalent problem set on LeetCode with test cases attached')..."
                value={overrideRationale}
                onChange={(e) => setOverrideRationale(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="deepml-modal-footer">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!allRequiredChecked && !overrideRationale.trim()}
          >
            {allRequiredChecked ? "✓ Confirm & Complete Task" : "Override & Complete Task"}
          </Button>
        </div>
      </div>
    </div>
  );
};
