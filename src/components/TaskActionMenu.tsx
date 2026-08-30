/**
 * Task action model (Task UI-4): one context-sensitive primary action, one
 * visible secondary action, and an accessible overflow menu for the rest.
 * Every transition from the original design remains available.
 */

import type { TaskRow, TransitionName, TransitionPayload } from "../lib/api";

export type TaskDialog = "complete" | "skip" | "reschedule" | "evidence" | "edit" | "archive";

export interface TaskActionContext {
  task: TaskRow;
  /** Runs a transition immediately (Start, Reopen). */
  run: (transition: TransitionName, payload?: TransitionPayload) => void;
  /** Opens the matching dialog (Complete, Reschedule, Skip, evidence, edit, archive). */
  openDialog: (dialog: TaskDialog) => void;
  toggleHistory: () => void;
  historyOpen: boolean;
  offline: boolean;
}

interface Action {
  label: string;
  run: () => void;
}

function isCustom(task: TaskRow): boolean {
  return task.template_task_key === null;
}

function isOpen(task: TaskRow): boolean {
  return task.state === "not_started" || task.state === "in_progress";
}

/** The next natural action for the task's current state. */
export function primaryAction(ctx: TaskActionContext): Action | null {
  const { task, run, openDialog } = ctx;
  switch (task.state) {
    case "not_started":
      return { label: "Start", run: () => run("start") };
    case "in_progress":
      return { label: "Complete", run: () => openDialog("complete") };
    case "completed":
      return { label: "Reopen", run: () => run("reopen", { to_state: "in_progress" }) };
    case "skipped":
      return { label: "Reopen", run: () => run("reopen") };
    default:
      return null;
  }
}

/** The one visible secondary action, when a natural one exists. */
export function secondaryAction(ctx: TaskActionContext): Action | null {
  const { task, openDialog } = ctx;
  if (task.state === "not_started") {
    return { label: "Complete", run: () => openDialog("complete") };
  }
  if (task.state === "in_progress" || task.state === "completed") {
    return {
      label: task.evidence_url || task.evidence_note ? "Edit evidence" : "Add evidence",
      run: () => openDialog("evidence"),
    };
  }
  return null;
}

/** Overflow menu items: every remaining valid action, in order. */
export function menuItems(ctx: TaskActionContext): {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}[] {
  const { task, openDialog, toggleHistory, historyOpen, offline } = ctx;
  const items: { label: string; onSelect: () => void; disabled?: boolean }[] = [];

  if (isOpen(task)) {
    items.push({ label: "Reschedule", onSelect: () => openDialog("reschedule") });
    items.push({ label: "Skip", onSelect: () => openDialog("skip") });
    if (isCustom(task)) {
      items.push({ label: "Edit task", onSelect: () => openDialog("edit") });
      items.push({ label: "Archive", onSelect: () => openDialog("archive") });
    }
  }

  items.push({
    label: task.evidence_url || task.evidence_note ? "Edit evidence" : "Add evidence",
    onSelect: () => openDialog("evidence"),
    disabled: offline,
  });

  items.push({
    label: historyOpen ? "Hide history" : "History",
    onSelect: toggleHistory,
    disabled: offline,
  });

  return items;
}

/** CSS variant class for the card, keeping states visually distinct. */
export function cardVariantClass(task: TaskRow, overdue: boolean): string {
  const classes = ["task-card"];
  if (overdue) classes.push("task-card--overdue");
  if (task.state === "completed") classes.push("task-card--completed");
  if (task.state === "skipped") classes.push("task-card--skipped");
  if (task.state === "archived") classes.push("task-card--archived");
  if (isCustom(task)) classes.push("task-card--custom");
  return classes.join(" ");
}
