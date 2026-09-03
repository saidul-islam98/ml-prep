import { useState } from "react";
import type { CurriculumTask } from "../curriculum/schemas";
import type { TaskExecutionProgressInput } from "../lib/api";
import { emptyTaskExecution } from "../hooks/useTaskExecution";
import { useModalFocus } from "../hooks/useModalFocus";
import {
  deliverableEvidenceKey,
  deliverableVerificationId,
  hasConcreteDeliverableEvidence,
} from "../lib/deliverables";
import { Badge, Button } from "./ui";

interface TaskDetailModalProps {
  task: CurriculumTask;
  isOpen: boolean;
  onClose: () => void;
  onStartFocus: (task: CurriculumTask) => void;
  onComplete: (task: CurriculumTask) => void;
  isCompleted?: boolean;
  progress?: TaskExecutionProgressInput;
  onProgressChange?: (progress: TaskExecutionProgressInput) => void | Promise<unknown>;
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onStartFocus,
  onComplete,
  isCompleted = false,
  progress: controlledProgress,
  onProgressChange,
}: TaskDetailModalProps) {
  const [localProgress, setLocalProgress] = useState(emptyTaskExecution);
  const [activeTab, setActiveTab] = useState<"execution" | "resources" | "criteria" | "interview">(
    "execution",
  );
  const progress = controlledProgress ?? localProgress;
  const dialogRef = useModalFocus<HTMLDivElement>(isOpen, onClose);

  if (!isOpen) return null;

  function save(next: TaskExecutionProgressInput) {
    if (!controlledProgress) setLocalProgress(next);
    void onProgressChange?.(next);
  }

  function toggle(list: string[], id: string) {
    return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
  }

  const totalSteps = task.todos.length;
  const doneSteps = task.todos.filter((todo) =>
    progress.completed_todo_ids.includes(todo.id),
  ).length;
  const stepPercent = totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0;

  return (
    <div
      className="deepml-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="deepml-modal-card deepml-task-detail-card"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="deepml-modal-header">
          <div className="deepml-modal-header-main">
            <div className="deepml-modal-eyebrow">
              <Badge tone="accent">Week {task.week}</Badge>
              <Badge tone="neutral">{task.category.replace("_", " ")}</Badge>
              <span className="deepml-pill--sm deepml-footer-meta">{task.minutes} min</span>
              {isCompleted && <Badge tone="success">Completed</Badge>}
            </div>
            <h2 id="task-modal-title" className="deepml-modal-title">
              {task.title}
            </h2>
            <p className="deepml-task-summary">{task.summary}</p>
          </div>
          <button
            type="button"
            className="deepml-modal-close"
            onClick={onClose}
            aria-label="Close task details"
          >
            x
          </button>
        </div>

        <div className="deepml-task-action-bar">
          <div className="deepml-task-progress-stat">
            <span className="deepml-progress-label">Step Progress:</span>
            <strong>
              {doneSteps} / {totalSteps} steps ({stepPercent}%)
            </strong>
          </div>
          <div className="deepml-task-action-btns">
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onStartFocus(task);
              }}
            >
              Launch Focus Mode
            </Button>
            {!isCompleted && (
              <Button
                variant="secondary"
                onClick={() => {
                  onClose();
                  onComplete(task);
                }}
              >
                Complete Task
              </Button>
            )}
          </div>
        </div>

        <div className="deepml-task-tabs" role="tablist" aria-label="Task details">
          {(
            [
              ["execution", `Execution (${totalSteps} steps)`],
              ["resources", `Targeted Resources (${task.resources?.length ?? 0})`],
              ["criteria", `Definition of Done (${task.completionCriteria.length})`],
              ["interview", "Interview Payoff"],
            ] as const
          ).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={`deepml-task-tab ${activeTab === tab ? "is-active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="deepml-modal-body deepml-task-detail-body">
          {activeTab === "execution" && (
            <div className="deepml-task-section">
              <div className="deepml-task-block">
                <h4 className="deepml-block-heading">Objective</h4>
                <p>{task.objective}</p>
              </div>
              {task.whyItMatters && (
                <div className="deepml-task-block">
                  <h4 className="deepml-block-heading">Why This Matters for Cohere</h4>
                  <p>{task.whyItMatters}</p>
                </div>
              )}
              {task.prerequisites?.length ? (
                <div className="deepml-task-block">
                  <h4 className="deepml-block-heading">Prerequisites</h4>
                  <ul className="deepml-task-list">
                    {task.prerequisites.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="deepml-task-block">
                <h4 className="deepml-block-heading">Atomic Action Steps</h4>
                <div className="deepml-checklist">
                  {task.todos.map((todo) => {
                    const checked = progress.completed_todo_ids.includes(todo.id);
                    return (
                      <label
                        key={todo.id}
                        className={`deepml-checklist-item ${checked ? "is-checked" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            save({
                              ...progress,
                              completed_todo_ids: toggle(progress.completed_todo_ids, todo.id),
                            })
                          }
                        />
                        <div className="deepml-checklist-content">
                          <span>{todo.text}</span>
                          {todo.estimatedMinutes && (
                            <span className="deepml-pill--sm deepml-step-time">
                              {todo.estimatedMinutes} min
                            </span>
                          )}
                          {todo.output && (
                            <div className="deepml-step-output">
                              Output: <code>{todo.output}</code>
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
              {task.deliverables?.length ? (
                <div className="deepml-task-block">
                  <h4 className="deepml-block-heading">Expected Deliverables</h4>
                  <ul className="deepml-deliverable-list">
                    {task.deliverables.map((deliverable) => {
                      const verified = progress.completed_criterion_ids.includes(
                        deliverableVerificationId(deliverable.id),
                      );
                      const evidenceReference =
                        progress.step_notes[deliverableEvidenceKey(deliverable.id)];
                      const verificationComplete =
                        verified &&
                        (!task.evidenceRequired ||
                          hasConcreteDeliverableEvidence(progress.step_notes, deliverable.id));
                      return (
                        <li key={deliverable.id}>
                          <strong>{deliverable.name}</strong>
                          {deliverable.required && <Badge tone="warning">Required</Badge>}
                          <Badge tone={verificationComplete ? "success" : "neutral"}>
                            {verificationComplete ? "Verified" : "Pending verification"}
                          </Badge>
                          <div className="deepml-step-output">
                            Artifact: <code>{deliverable.artifact}</code>
                          </div>
                          <div className="deepml-resource-instruction">
                            <strong>Verify:</strong> {deliverable.verify}
                          </div>
                          {evidenceReference && (
                            <div className="deepml-resource-instruction">
                              <strong>Evidence:</strong> {evidenceReference}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </div>
          )}

          {activeTab === "resources" && (
            <div className="deepml-task-section">
              <h4 className="deepml-block-heading">Targeted Reading & Tools</h4>
              <p className="deepml-section-sub">
                Use the assigned section and instruction; opening a resource is recorded in your
                progress.
              </p>
              <div className="deepml-resource-cards">
                {task.resources?.length ? (
                  task.resources.map((resource) => (
                    <div key={resource.id} className="deepml-resource-card">
                      <div className="deepml-resource-card-header">
                        <Badge tone={resource.priority === "must" ? "accent" : "neutral"}>
                          {resource.priority.toUpperCase()}
                        </Badge>
                        <Badge tone="role-agent-env">{resource.type}</Badge>
                        {resource.estimatedMinutes && (
                          <span className="deepml-step-time">{resource.estimatedMinutes} min</span>
                        )}
                      </div>
                      <h5 className="deepml-resource-title">
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() =>
                            save({
                              ...progress,
                              opened_resource_ids: Array.from(
                                new Set([...progress.opened_resource_ids, resource.id]),
                              ),
                            })
                          }
                        >
                          {resource.title} - open
                        </a>
                      </h5>
                      <div className="deepml-resource-instruction">
                        <strong>Instruction:</strong> {resource.instruction}
                      </div>
                      {progress.opened_resource_ids.includes(resource.id) && (
                        <Badge tone="success">Opened</Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <p>
                    No external reading is assigned. Execute and verify the implementation steps.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "criteria" && (
            <div className="deepml-task-section">
              <h4 className="deepml-block-heading">Definition of Done</h4>
              <p className="deepml-section-sub">
                Verify each gate before marking this task complete:
              </p>
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
                        onChange={() =>
                          save({
                            ...progress,
                            completed_criterion_ids: toggle(
                              progress.completed_criterion_ids,
                              criterion.id,
                            ),
                          })
                        }
                      />
                      <div className="deepml-checklist-content">
                        <span>{criterion.text}</span>
                        {criterion.required && <Badge tone="warning">Required Gate</Badge>}
                      </div>
                    </label>
                  );
                })}
              </div>
              {task.knowledgeChecks?.length ? (
                <div className="deepml-task-block deepml-knowledge-block">
                  <h4 className="deepml-block-heading">Self-Assessment Knowledge Check</h4>
                  <ul className="deepml-task-list">
                    {task.knowledgeChecks.map((item) => (
                      <li key={item.id} className="deepml-knowledge-item">
                        <strong>Q:</strong> {item.question}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}

          {activeTab === "interview" && (
            <div className="deepml-task-section">
              <h4 className="deepml-block-heading">Interview Payoff</h4>
              <p className="deepml-section-sub">
                After completing this task, rehearse these questions from your evidence:
              </p>
              <div className="deepml-interview-box">
                <ul className="deepml-interview-list">
                  {(
                    task.interviewQuestions ?? [
                      "Explain the decision, evidence, limitation, and next step.",
                    ]
                  ).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <label className="deepml-label">
                Reflection / interview takeaway
                <textarea
                  className="deepml-textarea"
                  rows={3}
                  value={progress.reflection_note ?? ""}
                  onChange={(event) => save({ ...progress, reflection_note: event.target.value })}
                />
              </label>
            </div>
          )}
        </div>

        <div className="deepml-modal-footer">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onClose();
              onStartFocus(task);
            }}
          >
            Launch Focus Mode
          </Button>
        </div>
      </div>
    </div>
  );
}
