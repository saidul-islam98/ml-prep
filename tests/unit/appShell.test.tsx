import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import App from "../../src/App";
import type { PrepApi } from "../../src/lib/api";

// The shell tests isolate navigation behavior from auth and data: a session
// is always present and the API boundary returns stable, empty fixtures.
vi.mock("../../src/auth/useSession", () => ({
  useSession: () => ({
    status: "authenticated",
    session: { user: { id: "test-user" } } as unknown as Session,
  }),
}));

const stubApi: Pick<PrepApi, "fetchProfile" | "fetchTasks" | "fetchPlanWeeks" | "fetchProjects"> = {
  fetchProfile: async () => ({
    user_id: "test-user",
    timezone: "America/Toronto",
    reminder_local_time: "17:00",
    reminder_installed_at: null,
    reminder_verified_at: null,
    post_training_enabled: false,
    template_version: 1,
  }),
  fetchTasks: async () => [],
  fetchPlanWeeks: async () => [],
  fetchProjects: async () => [],
};

vi.mock("../../src/hooks/useApi", () => ({
  useApi: () => stubApi as PrepApi,
  getApi: () => stubApi as PrepApi,
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

describe("App shell", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  });

  it("renders the Today view by default with primary navigation landmarks", async () => {
    renderApp();

    expect(await screen.findByRole("heading", { name: "Today", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    const todayLinks = screen.getAllByRole("link", { name: "Today" });
    expect(todayLinks.some((l) => l.getAttribute("aria-current") === "page")).toBe(true);
  });

  it("navigates to another view through a hash link and back", async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByRole("heading", { name: "Today", level: 1 });

    await user.click(screen.getAllByRole("link", { name: "Plan" })[0]);
    expect(window.location.hash).toBe("#/plan");
    expect(await screen.findByRole("heading", { name: "Plan", level: 1 })).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: "Plan" })
        .some((l) => l.getAttribute("aria-current") === "page"),
    ).toBe(true);

    await user.click(screen.getAllByRole("link", { name: "Today" })[0]);
    expect(window.location.hash).toBe("#/today");
    expect(await screen.findByRole("heading", { name: "Today", level: 1 })).toBeInTheDocument();
  });

  it("renders all seven MVP views as navigation entries", async () => {
    renderApp();
    await screen.findByRole("heading", { name: "Today", level: 1 });
    for (const label of [
      "Today",
      "Plan",
      "Projects",
      "Practice",
      "Readiness",
      "Progress",
      "Settings",
    ]) {
      expect(screen.getAllByRole("link", { name: label }).length).toBeGreaterThan(0);
    }
  });

  it("announces offline mode and disables mutation controls application-wide", async () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    renderApp();

    expect(await screen.findByText(/Saved data remains visible/)).toBeInTheDocument();
    expect(screen.getByRole("group")).toBeDisabled();
  });
});
