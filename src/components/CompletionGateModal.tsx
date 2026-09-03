import { useState } from "react";
import type { CurriculumTask } from "../curriculum/schemas";
import type { TaskExecutionProgressInput } from "../lib/api";
import { elapsedSeconds, emptyTaskExecution } from "../hooks/useTaskExecution";
import { useModalFocus } from "../hooks/useModalFocus";
import { isValidHttpsUrl } from "../lib/constants";
import {
  deliverableEvidenceKey,
  deliverableVerificationId,
  hasConcreteDeliverableEvidence,
} from "../lib/deliverables";
import { Badge, Button } from "./ui";

export interface CompletionGateResult {
  actualMinutes: number;
  evidenceUrl?: string;
  evidenceNote?: string;
  overrideReason?: string;
  completedCriterionIds: string[];
  elapsedSeconds: number;
}

interface CompletionGateModalProps {
  task: CurriculumTask;
  isOpen: boolean;
  onClose: () => void;
  onConfirmComplete: (task: CurriculumTask, result: CompletionGateResult) => void;
  progress?: TaskExecutionProgressInput;
  onProgressChange?: (progress: TaskExecutionProgressInput) => void | Promise<unknown>;
  initialEvidenceUrl?: string | null;
  initialEvidenceNote?: string | null;
  estimatedMinutes?: number;
}

export function CompletionGateModal({
  task,
  isOpen,
  onClose,
  onConfirmComplete,
  progress: controlledProgress,
  onProgressChange,
  initialEvidenceUrl,
  initialEvidenceNote,
  estimatedMinutes,
}: CompletionGateModalProps) {
  const [localProgress, setLocalProgress] = useState(emptyTaskExecution);
  const progress = controlledProgress ?? localProgress;
  const elapsed = elapsedSeconds(progress);
  const [actualMinutes, setActualMinutes] = useState(
    String(elapsed > 0 ? Math.max(1, Math.ceil(elapsed / 60)) : (estimatedMinutes ?? task.minutes)),
  );
  const [evidenceUrl, setEvidenceUrl] = useState(initialEvidenceUrl ?? "");
  const [evidenceNote, setEvidenceNote] = useState(initialEvidenceNote ?? "");
  const [overrideReason, setOverrideReason] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const dialogRef = useModalFocus<HTMLDivElement>(isOpen, onClose);

  if (!isOpen) return null;

  function save(next: TaskExecutionProgressInput) {
    if (!controlledProgress) setLocalProgress(next);
    void onProgressChange?.(next);
  }

  function toggleCriterion(id: string) {
    const ids = progress.completed_criterion_ids.includes(id)
      ? progress.completed_criterion_ids.filter((item) => item !== id)
      : [...progress.completed_criterion_ids, id];
    save({ ...progress, completed_criterion_ids: ids });
  }

  const required = task.completionCriteria.filter((criterion) => criterion.required);
  const evidenceRequired = task.evidenceRequired === true;
  const requiredDeliverables = task.deliverables.filter((deliverable) => deliverable.required);
  const requiredVerificationIds = [
    ...required.map((criterion) => criterion.id),
    ...requiredDeliverables.map((deliverable) => deliverableVerificationId(deliverable.id)),
  ];
  const allRequiredChecked = requiredVerificationIds.every((id) =>
    progress.completed_criterion_ids.includes(id),
  );
  const missingEvidence = evidenceRequired
    ? requiredDeliverables.filter(
        (deliverable) => !hasConcreteDeliverableEvidence(progress.step_notes, deliverable.id),
      )
    : [];

  function confirm() {
    const minutes = Number(actualMinutes);
    if (!Number.isInteger(minutes) || minutes <= 0) {
      setValidationError("Actual minutes must be a positive whole number.");
      return;
    }
    if (!isValidHttpsUrl(evidenceUrl)) {
      setValidationError("Evidence links must use HTTPS.");
      return;
    }
    if (missingEvidence.length > 0) {
      setValidationError(
        "This task requires evidence. Add a concrete reference for every required deliverable.",
      );
      return;
    }
    if (!allRequiredChecked && !overrideReason.trim()) {
      setValidationError(
        "Explain why this task is complete despite the unchecked required criteria.",
      );
      return;
    }
    setValidationError(null);
    onConfirmComplete(task, {
      actualMinutes: minutes,
      ...(evidenceUrl ? { evidenceUrl } : {}),
      ...(evidenceNote
        ? { evidenceNote }
        : evidenceRequired
          ? {
              evidenceNote: requiredDeliverables
                .map(
                  (deliverable) =>
                    `${deliverable.name}: ${progress.step_notes[deliverableEvidenceKey(deliverable.id)].trim()}`,
                )
                .join(" | "),
            }
          : {}),
      ...(!allRequiredChecked ? { overrideReason: overrideReason.trim() } : {}),
      completedCriterionIds: progress.completed_criterion_ids,
      elapsedSeconds: elapsed,
    });
  }

  return (
    <div
      className="deepml-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-modal-title"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="deepml-modal-card deepml-gate-card"
        onClick={(event) => event.stopPropagation()}
      >
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
              Confirm the required output and evidence for <strong>{task.title}</strong>. Unchecked
              gates require an explicit, audited override.
            </p>
          </div>
          <button
            type="button"
            className="deepml-modal-close"
            onClick={onClose}
            aria-label="Close gate dialog"
          >
            x
          </button>
        </div>

        <div className="deepml-modal-body deepml-gate-body">
          <div className="deepml-checklist">
            {task.completionCriteria.map((criterion) => {
              const checked = progress.completed_criterion_ids.includes(criterion.id);
              return (
                <label
                  key={criterion.id}
                  className={`deepml-checklist-item ${checked ? "is-checked" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCriterion(criterion.id)}
                  />
                  <div className="deepml-checklist-content">
                    <span>{criterion.text}</span>
                    {criterion.required && <Badge tone="warning">Required Gate</Badge>}
                  </div>
                </label>
              );
            })}
          </div>

          {requiredDeliverables.length > 0 && (
            <div className="deepml-task-block">
              <h3 className="deepml-block-heading">Required deliverables</h3>
              <p className="deepml-section-sub">
                {evidenceRequired
                  ? "Verify each artifact against its check and record exactly where the proof lives."
                  : "Verify each artifact against its check. Evidence references are optional for this task."}
              </p>
              <ul className="deepml-deliverable-list">
                {requiredDeliverables.map((deliverable) => {
                  const verificationId = deliverableVerificationId(deliverable.id);
                  const evidenceKey = deliverableEvidenceKey(deliverable.id);
                  const checked = progress.completed_criterion_ids.includes(verificationId);
                  return (
                    <li key={deliverable.id}>
                      <label className={`deepml-checklist-item ${checked ? "is-checked" : ""}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCriterion(verificationId)}
                        />
                        <span className="deepml-checklist-content">
                          <strong>{deliverable.name}</strong>
                          <Badge tone="warning">Verify artifact</Badge>
                        </span>
                      </label>
                      <div className="deepml-step-output">
                        Artifact: <code>{deliverable.artifact}</code>
                      </div>
                      <div className="deepml-resource-instruction">
                        <strong>Verification check:</strong> {deliverable.verify}
                      </div>
                      <label className="deepml-label">
                        Evidence for {deliverable.name}
                        {!evidenceRequired && " (optional)"}
                        <textarea
                          className="deepml-textarea"
                          rows={2}
                          value={progress.step_notes[evidenceKey] ?? ""}
                          placeholder="Repository path, commit, report section, recording, or submission confirmation"
                          onChange={(event) =>
                            save({
                              ...progress,
                              step_notes: {
                                ...progress.step_notes,
                                [evidenceKey]: event.target.value,
                              },
                            })
                          }
                        />
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="deepml-task-block">
            <label className="deepml-label">
              Actual minutes
              <input
                className="deepml-input"
                inputMode="numeric"
                value={actualMinutes}
                onChange={(event) => setActualMinutes(event.target.value)}
              />
            </label>
            <label className="deepml-label">
              {evidenceRequired ? "Evidence URL (HTTPS)" : "Evidence URL (HTTPS, optional)"}
              <input
                className="deepml-input"
                type="url"
                value={evidenceUrl}
                onChange={(event) => setEvidenceUrl(event.target.value)}
              />
            </label>
            <label className="deepml-label">
              {evidenceRequired ? "Evidence note" : "Evidence note (optional)"}
              <textarea
                className="deepml-textarea"
                rows={2}
                value={evidenceNote}
                onChange={(event) => setEvidenceNote(event.target.value)}
              />
            </label>
            {evidenceRequired && (
              <p className="deepml-section-sub">
                Each required deliverable needs its own verification check and evidence reference.
                The task-level URL and note are optional context.
              </p>
            )}
          </div>

          {!allRequiredChecked && (
            <div className="deepml-gate-warning-box">
              <div className="deepml-gate-warning-title">
                Some required criteria are not checked
              </div>
              <p>
                Provide a concrete equivalent proof or explain the deliberate exception. This reason
                is stored in task history, separate from evidence.
              </p>
              <label className="deepml-label">
                Required override rationale
                <textarea
                  className="deepml-textarea"
                  rows={3}
                  placeholder="Required override rationale"
                  value={overrideReason}
                  onChange={(event) => setOverrideReason(event.target.value)}
                />
              </label>
            </div>
          )}
          {validationError && (
            <p className="task-error" role="alert">
              {validationError}
            </p>
          )}
        </div>

        <div className="deepml-modal-footer">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirm}>
            {allRequiredChecked ? "Confirm & Complete Task" : "Override & Complete Task"}
          </Button>
        </div>
      </div>
    </div>
  );
}
