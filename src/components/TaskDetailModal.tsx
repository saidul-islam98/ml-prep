import React, { useState, useEffect } from "react";
import type { CurriculumTask } from "../curriculum/schemas";
import { Badge, Button } from "./ui";

interface TaskDetailModalProps {
  task: CurriculumTask;
  isOpen: boolean;
  onClose: () => void;
  onStartFocus: (task: CurriculumTask) => void;
  onComplete: (task: CurriculumTask) => void;
  isCompleted?: boolean;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onStartFocus,
  onComplete,
  isCompleted = false,
}) => {
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [completedCriteria, setCompletedCriteria] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"execution" | "resources" | "criteria" | "interview">(
    "execution",
  );

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalSteps = task.todos.length;
  const doneSteps = Object.values(completedSteps).filter(Boolean).length;
  const stepPercent = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  const toggleStep = (id: string) => {
    setCompletedSteps((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCriterion = (id: string) => {
    setCompletedCriteria((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div
      className="deepml-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
      onClick={onClose}
    >
      <div
        className="deepml-modal-card deepml-task-detail-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {/* Action Header Bar */}
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
              ⏱ Launch Focus Mode
            </Button>
            {!isCompleted && (
              <Button
                variant="secondary"
                onClick={() => {
                  onClose();
                  onComplete(task);
                }}
              >
                ✓ Complete Task
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="deepml-task-tabs">
          <button
            type="button"
            className={`deepml-task-tab ${activeTab === "execution" ? "is-active" : ""}`}
            onClick={() => setActiveTab("execution")}
          >
            Execution ({totalSteps} steps)
          </button>
          <button
            type="button"
            className={`deepml-task-tab ${activeTab === "resources" ? "is-active" : ""}`}
            onClick={() => setActiveTab("resources")}
          >
            Targeted Resources ({task.resources?.length || 0})
          </button>
          <button
            type="button"
            className={`deepml-task-tab ${activeTab === "criteria" ? "is-active" : ""}`}
            onClick={() => setActiveTab("criteria")}
          >
            Definition of Done ({task.completionCriteria.length})
          </button>
          <button
            type="button"
            className={`deepml-task-tab ${activeTab === "interview" ? "is-active" : ""}`}
            onClick={() => setActiveTab("interview")}
          >
            Interview Payoff
          </button>
        </div>

        {/* Modal Body */}
        <div className="deepml-modal-body deepml-task-detail-body">
          {activeTab === "execution" && (
            <div className="deepml-task-section">
              <div className="deepml-task-block">
                <h4 className="deepml-block-heading">🎯 Objective</h4>
                <p>{task.objective}</p>
              </div>

              {task.whyItMatters && (
                <div className="deepml-task-block">
                  <h4 className="deepml-block-heading">💡 Why This Matters for Cohere</h4>
                  <p>{task.whyItMatters}</p>
                </div>
              )}

              {task.prerequisites && task.prerequisites.length > 0 && (
                <div className="deepml-task-block">
                  <h4 className="deepml-block-heading">📋 Prerequisites</h4>
                  <ul className="deepml-task-list">
                    {task.prerequisites.map((p, idx) => (
                      <li key={idx}>✓ {p}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="deepml-task-block">
                <h4 className="deepml-block-heading">⚡ Atomic Action Steps</h4>
                <div className="deepml-checklist">
                  {task.todos.map((todo) => (
                    <label
                      key={todo.id}
                      className={`deepml-checklist-item ${completedSteps[todo.id] ? "is-checked" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={!!completedSteps[todo.id]}
                        onChange={() => toggleStep(todo.id)}
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
                  ))}
                </div>
              </div>

              {task.deliverables && task.deliverables.length > 0 && (
                <div className="deepml-task-block">
                  <h4 className="deepml-block-heading">📦 Expected Deliverables</h4>
                  <ul className="deepml-deliverable-list">
                    {task.deliverables.map((deliv, idx) => (
                      <li key={idx}>
                        <code>{deliv}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === "resources" && (
            <div className="deepml-task-section">
              <h4 className="deepml-block-heading">Targeted Reading & Tools</h4>
              <p className="deepml-section-sub">
                Read only the assigned sections with explicit time allocations:
              </p>
              <div className="deepml-resource-cards">
                {task.resources && task.resources.length > 0 ? (
                  task.resources.map((res) => (
                    <div key={res.id} className="deepml-resource-card">
                      <div className="deepml-resource-card-header">
                        <Badge tone={res.priority === "must" ? "accent" : "neutral"}>
                          {res.priority.toUpperCase()}
                        </Badge>
                        <Badge tone="role-agent-env">{res.type}</Badge>
                        {res.estimatedMinutes && (
                          <span className="deepml-step-time">{res.estimatedMinutes} min</span>
                        )}
                      </div>
                      <h5 className="deepml-resource-title">
                        <a href={res.url} target="_blank" rel="noopener noreferrer">
                          {res.title} ↗
                        </a>
                      </h5>
                      <div className="deepml-resource-instruction">
                        <strong>Instruction:</strong> {res.instruction}
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No external readings assigned for this task. Focus on implementation.</p>
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
                {task.completionCriteria.map((crit) => (
                  <label
                    key={crit.id}
                    className={`deepml-checklist-item ${completedCriteria[crit.id] ? "is-checked" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={!!completedCriteria[crit.id]}
                      onChange={() => toggleCriterion(crit.id)}
                    />
                    <div className="deepml-checklist-content">
                      <span>{crit.text}</span>
                      {crit.required && <Badge tone="warning">Required Gate</Badge>}
                    </div>
                  </label>
                ))}
              </div>

              {task.knowledgeChecks && task.knowledgeChecks.length > 0 && (
                <div className="deepml-task-block deepml-knowledge-block">
                  <h4 className="deepml-block-heading">🧠 Self-Assessment Knowledge Check</h4>
                  <ul className="deepml-task-list">
                    {task.knowledgeChecks.map((kc) => (
                      <li key={kc.id} className="deepml-knowledge-item">
                        <strong>Q:</strong> {kc.question}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === "interview" && (
            <div className="deepml-task-section">
              <h4 className="deepml-block-heading">🎤 Interview Payoff</h4>
              <p className="deepml-section-sub">
                Upon completing this task, you will have demonstrable evidence to answer:
              </p>
              <div className="deepml-interview-box">
                {task.interviewQuestions && task.interviewQuestions.length > 0 ? (
                  <ul className="deepml-interview-list">
                    {task.interviewQuestions.map((q, idx) => (
                      <li key={idx}>"{q}"</li>
                    ))}
                  </ul>
                ) : (
                  <p>
                    Demonstrate systematic problem solving and rigorous verification under pressure.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
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
};
