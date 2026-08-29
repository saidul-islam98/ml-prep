/**
 * Accessibility acceptance tests for the hardening pass (todo.md Task 16b):
 * skip link, landmarks, heading order, focus visibility, and 44px targets.
 */

import { describe, expect, it, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import App from "../../src/App";

vi.mock("../../src/auth/useSession", () => ({
  useSession: () => ({
    status: "authenticated",
    session: { user: { id: "test-user" } } as unknown as Session,
  }),
}));

const apiStub = vi.hoisted(() => ({
  current: null as unknown as import("../../src/lib/api").PrepApi,
}));
vi.mock("../../src/hooks/useApi", () => ({
  useApi: () => apiStub.current,
  getApi: () => apiStub.current,
}));

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
}

describe("accessibility hardening", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
    apiStub.current = {
      fetchProfile: vi.fn().mockResolvedValue({
        user_id: "u",
        timezone: "America/Toronto",
        reminder_local_time: "17:00",
        reminder_installed_at: null,
        reminder_verified_at: null,
        post_training_enabled: false,
        template_version: 1,
      }),
      fetchTasks: vi.fn().mockResolvedValue([]),
      fetchPlanWeeks: vi.fn().mockResolvedValue([]),
      fetchProjects: vi.fn().mockResolvedValue([]),
      fetchMilestones: vi.fn().mockResolvedValue([]),
      fetchCheckin: vi.fn().mockResolvedValue(null),
    } as unknown as import("../../src/lib/api").PrepApi;
  });

  it("provides a skip link that targets the main landmark", async () => {
    renderApp();
    const skip = await screen.findByRole("link", { name: "Skip to main content" });
    expect(skip).toHaveAttribute("href", "#main");
    expect(document.getElementById("main")).toBeInTheDocument();
  });

  it("keeps exactly one h1 per view and ordered headings", async () => {
    renderApp();
    await screen.findByRole("heading", { name: "Today", level: 1 });
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    // No heading level may skip more than one level down from the previous.
    const levels = [...document.querySelectorAll("h1, h2, h3, h4")].map((h) =>
      Number(h.tagName.slice(1)),
    );
    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
    }
  });

  it("keeps the focus-visible outline contract in the global stylesheet", async () => {
    renderApp();
    await screen.findByRole("heading", { name: "Today", level: 1 });
    // jsdom does not apply stylesheets; assert the stylesheet contract that
    // every interactive element relies on.
    const css = readFileSync(join(process.cwd(), "src", "styles", "global.css"), "utf8");
    expect(css).toMatch(/:focus-visible\s*{[^}]*outline: 3px solid var\(--color-focus\)/);
    expect(css).toContain("--target-min: 44px");
  });

  it("enforces the 44px minimum on navigation links and form controls", async () => {
    renderApp();
    await screen.findByRole("heading", { name: "Today", level: 1 });
    const css = readFileSync(join(process.cwd(), "src", "styles", "global.css"), "utf8");
    // Nav links, buttons, and inputs reference the shared minimum height.
    expect(css).toMatch(/\.app-nav-link\s*{[^}]*min-height: var\(--target-min\)/);
    expect(css).toMatch(/\.task-actions button,[^{]*{[^}]*min-height: 44px/s);
  });
});
