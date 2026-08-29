import type { ComponentType } from "react";
import { TodayView } from "./TodayView";
import { PlanView } from "./PlanView";
import { ProjectsView } from "./ProjectsView";
import { PracticeView } from "./PracticeView";
import { ReadinessView } from "./ReadinessView";
import { ProgressView } from "./ProgressView";
import { SettingsView } from "./SettingsView";

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
  today: { key: "today", path: "/today", label: "Today", component: TodayView },
  plan: { key: "plan", path: "/plan", label: "Plan", component: PlanView },
  projects: {
    key: "projects",
    path: "/projects",
    label: "Projects",
    component: ProjectsView,
  },
  practice: {
    key: "practice",
    path: "/practice",
    label: "Practice",
    component: PracticeView,
  },
  readiness: {
    key: "readiness",
    path: "/readiness",
    label: "Readiness",
    component: ReadinessView,
  },
  progress: {
    key: "progress",
    path: "/progress",
    label: "Progress",
    component: ProgressView,
  },
  settings: {
    key: "settings",
    path: "/settings",
    label: "Settings",
    component: SettingsView,
  },
};

/** Resolve a route path to its view; unknown paths fall back to Today. */
export function resolveView(path: string): ViewDefinition {
  for (const view of Object.values(VIEWS)) {
    if (view.path === path) return view;
  }
  return VIEWS.today;
}
