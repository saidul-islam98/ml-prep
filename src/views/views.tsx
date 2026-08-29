import type { ComponentType } from "react";

export type ViewKey =
  "today" | "plan" | "projects" | "practice" | "readiness" | "progress" | "settings";

export interface ViewDefinition {
  key: ViewKey;
  path: string;
  label: string;
  component: ComponentType;
}

/**
 * View registry. Order drives navigation order; `today` is the default route
 * and must stay reachable from every view (WEBAPP_SPEC.md §15).
 * Placeholder components are replaced by their implementation tasks
 * (todo.md Tasks 8-15) without changing this registry shape.
 */
export const VIEWS: Record<ViewKey, ViewDefinition> = {
  today: { key: "today", path: "/today", label: "Today", component: TodayPlaceholder },
  plan: { key: "plan", path: "/plan", label: "Plan", component: PlanPlaceholder },
  projects: {
    key: "projects",
    path: "/projects",
    label: "Projects",
    component: ProjectsPlaceholder,
  },
  practice: {
    key: "practice",
    path: "/practice",
    label: "Practice",
    component: PracticePlaceholder,
  },
  readiness: {
    key: "readiness",
    path: "/readiness",
    label: "Readiness",
    component: ReadinessPlaceholder,
  },
  progress: {
    key: "progress",
    path: "/progress",
    label: "Progress",
    component: ProgressPlaceholder,
  },
  settings: {
    key: "settings",
    path: "/settings",
    label: "Settings",
    component: SettingsPlaceholder,
  },
};

/** Resolve a route path to its view; unknown paths fall back to Today. */
export function resolveView(path: string): ViewDefinition {
  for (const view of Object.values(VIEWS)) {
    if (view.path === path) return view;
  }
  return VIEWS.today;
}

function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <section aria-labelledby="view-title" className="placeholder">
      <h1 id="view-title">{title}</h1>
      <p>{note}</p>
    </section>
  );
}

function TodayPlaceholder() {
  return (
    <Placeholder
      title="Today"
      note="Today's tasks, overdue resolution, and the end-of-day check-in will appear here."
    />
  );
}
function PlanPlaceholder() {
  return (
    <Placeholder
      title="Plan"
      note="The fourteen-week schedule with filters and exit checks will appear here."
    />
  );
}
function ProjectsPlaceholder() {
  return (
    <Placeholder
      title="Projects"
      note="Project budgets, milestones, evidence, and completion gates will appear here."
    />
  );
}
function PracticePlaceholder() {
  return (
    <Placeholder
      title="Practice"
      note="Coding sessions, mock interviews, and correction tasks will appear here."
    />
  );
}
function ReadinessPlaceholder() {
  return (
    <Placeholder title="Readiness" note="Evidence-based role readiness gates will appear here." />
  );
}
function ProgressPlaceholder() {
  return (
    <Placeholder
      title="Progress"
      note="Planned versus completed minutes and outcome trends will appear here."
    />
  );
}
function SettingsPlaceholder() {
  return (
    <Placeholder
      title="Settings"
      note="Account, reminder, optional-track, and export controls will appear here."
    />
  );
}
