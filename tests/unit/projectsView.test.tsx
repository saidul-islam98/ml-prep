/**
 * Projects view component tests (todo.md Task 11): budgets vs actual
 * minutes, milestone gates, and the server-locked optional Post-Training
 * unlock with its explicit time-budget tradeoff.
 */

import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PrepApi, ProjectRow } from "../../src/lib/api";
import { ProjectsView } from "../../src/views/ProjectsView";

function project(overrides: Partial<ProjectRow> = {}): ProjectRow {
  return {
    id: "p1",
    project_key: "evalops",
    name: "EvalOps for tool-using enterprise agents",
    target_roles: ["data_eval", "agent_env"],
    budget_minutes: 1950,
    state: "active",
    repository_url: null,
    design_url: null,
    report_url: null,
    demo_url: null,
    blocker_note: null,
    ...overrides,
  };
}

const apiStub = vi.hoisted(() => ({ current: null as unknown as PrepApi }));
vi.mock("../../src/hooks/useApi", () => ({
  useApi: () => apiStub.current,
  getApi: () => apiStub.current,
}));

function makeApiStub(overrides: Partial<PrepApi> = {}): PrepApi {
  return {
    fetchProfile: vi.fn().mockResolvedValue({
      user_id: "user-1",
      timezone: "America/Toronto",
      reminder_local_time: "17:00",
      reminder_installed_at: null,
      reminder_verified_at: null,
      post_training_enabled: false,
      template_version: 1,
    }),
    fetchTasks: vi.fn().mockResolvedValue([]),
    fetchTaskEvents: vi.fn().mockResolvedValue([]),
    fetchPlanWeeks: vi.fn().mockResolvedValue([]),
    fetchProjects: vi.fn().mockResolvedValue([
      project(),
      project({
        id: "p3",
        project_key: "post_training_lab",
        name: "Verifier-guided post-training mini-lab",
        target_roles: ["post_training"],
        budget_minutes: 1200,
        state: "locked",
      }),
    ]),
    fetchMilestones: vi.fn().mockResolvedValue([
      {
        id: "m-gate-1",
        project_id: "p1",
        title: "Release v0.1",
        acceptance_criteria: "Fresh clone runs the smoke suite",
        target_date: "2026-10-11",
        completed_at: null,
        evidence_url: null,
        sort_order: 4,
        is_completion_gate: true,
      },
    ]),
    fetchCheckin: vi.fn().mockResolvedValue(null),
    saveCheckin: vi.fn().mockResolvedValue(undefined),
    createCustomTask: vi.fn(),
    transition: vi.fn(),
    unlockPostTraining: vi.fn(),
    updateProject: vi.fn().mockResolvedValue(undefined),
    updateMilestone: vi.fn().mockResolvedValue(undefined),
    seedPlan: vi.fn(),
    ...overrides,
  } as unknown as PrepApi;
}

function renderView() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ProjectsView />
    </QueryClientProvider>,
  );
}

describe("ProjectsView", () => {
  let api: PrepApi;

  beforeEach(() => {
    api = makeApiStub();
    apiStub.current = api;
  });

  it("renders projects with purpose, roles, and budget vs actual minutes", async () => {
    vi.mocked(api.fetchTasks).mockResolvedValue([]);
    renderView();

    expect(await screen.findByText("EvalOps for tool-using enterprise agents")).toBeInTheDocument();
    expect(screen.getByText("Portfolio builds")).toBeInTheDocument();
    expect(screen.getAllByText(/0 of 33 h logged/).length).toBeGreaterThan(0);
    expect(screen.getByText(/two connected required projects/i)).toBeInTheDocument();
  });

  it("counts completed project tasks as logged minutes", async () => {
    vi.mocked(api.fetchTasks).mockResolvedValue([
      {
        id: "t1",
        user_id: "user-1",
        source_week_number: 2,
        template_task_key: null,
        title: "Project work",
        description: null,
        acceptance_note: null,
        category: "deep_work",
        role_tags: ["data_eval"],
        project_id: "p1",
        original_scheduled_date: "2026-09-09",
        scheduled_date: "2026-09-09",
        estimated_minutes: 120,
        actual_minutes: 130,
        revision: 1,
        state: "completed",
        completed_at: "2026-09-09T18:00:00Z",
        skip_reason: null,
        evidence_url: null,
        evidence_note: null,
        source_practice_session_id: null,
      },
    ]);
    renderView();

    expect(await screen.findByText(/2 of 33 h logged/)).toBeInTheDocument();
  });

  it("toggles a milestone completion gate through the update API", async () => {
    const user = userEvent.setup();
    renderView();

    await screen.findByText("Release v0.1");
    const milestoneList = document.querySelector(".milestone-list")!;
    const checkbox = within(milestoneList as HTMLElement).getByRole("checkbox");
    await user.click(checkbox);

    await waitFor(() => {
      expect(api.updateMilestone).toHaveBeenCalledWith("m-gate-1", {
        completed_at: expect.any(String),
      });
    });
  });

  it("shows the locked Post-Training card with the time-budget tradeoff and opt-in gate", async () => {
    renderView();

    expect(await screen.findByText(/Enable the optional Post-Training track/)).toBeInTheDocument();
    expect(screen.getByText(/activates 1,?200 min/i)).toBeInTheDocument();
    expect(screen.getByText(/deactivates 1,?200 min/i)).toBeInTheDocument();
    expect(screen.getByText(/One-way in MVP/i)).toBeInTheDocument();

    const unlock = screen.getByRole("button", { name: "Enable Post-Training" });
    expect(unlock).toBeDisabled();

    await userEvent.setup().click(screen.getByLabelText(/explicitly enable Post-Training/i));
    expect(screen.getByRole("button", { name: "Enable Post-Training" })).toBeEnabled();
  });

  it("surfaces a friendly message when the server rejects the unlock", async () => {
    const user = userEvent.setup();
    vi.mocked(api.unlockPostTraining).mockRejectedValue(
      Object.assign(new Error("gates_not_met: ..."), { kind: "gates_not_met" }),
    );
    renderView();

    await screen.findByText(/Enable the optional Post-Training track/);
    await user.click(screen.getByLabelText(/explicitly enable Post-Training/i));
    await user.click(screen.getByRole("button", { name: "Enable Post-Training" }));

    expect(await screen.findByText(/rejected until both required projects/)).toBeInTheDocument();
  });

  it("shows the enabled state after a successful unlock", async () => {
    const user = userEvent.setup();
    vi.mocked(api.unlockPostTraining).mockResolvedValue({ status: "ok" });
    renderView();
    // The server flips the profile flag; simulate the refetch seeing it.
    vi.mocked(api.fetchProfile).mockResolvedValue({
      user_id: "user-1",
      timezone: "America/Toronto",
      reminder_local_time: "17:00",
      reminder_installed_at: null,
      reminder_verified_at: null,
      post_training_enabled: true,
      template_version: 1,
    });

    await screen.findByText(/Enable the optional Post-Training track/);
    await user.click(screen.getByLabelText(/explicitly enable Post-Training/i));
    await user.click(screen.getByRole("button", { name: "Enable Post-Training" }));

    expect(await screen.findByText(/Post-Training track enabled/)).toBeInTheDocument();
  });

  it("does not render a project-state editor (state is server-controlled)", async () => {
    renderView();
    await screen.findByText("EvalOps for tool-using enterprise agents");
    expect(screen.getByText("Status: active")).toBeInTheDocument();
    expect(screen.queryByLabelText("Project status")).not.toBeInTheDocument();
  });

  it("saves project evidence links after HTTPS validation", async () => {
    const user = userEvent.setup();
    renderView();

    const card = (await screen.findByLabelText(/Repository URL/)).closest(
      "form",
    ) as HTMLFormElement;
    await user.type(within(card).getByLabelText(/Repository URL/), "http://insecure.example/repo");
    await user.click(within(card).getByRole("button", { name: "Save project" }));

    expect(await screen.findByText(/Evidence links must use HTTPS/)).toBeInTheDocument();
    expect(api.updateProject).not.toHaveBeenCalled();

    await user.clear(within(card).getByLabelText(/Repository URL/));
    await user.type(
      within(card).getByLabelText(/Repository URL/),
      "https://github.com/example/repo",
    );
    await user.click(within(card).getByRole("button", { name: "Save project" }));

    await waitFor(() => {
      expect(api.updateProject).toHaveBeenCalledWith(
        "p1",
        expect.objectContaining({ repository_url: "https://github.com/example/repo" }),
      );
    });
    // The state column is not user-writable any more - never sent.
    const fields = vi.mocked(api.updateProject).mock.calls[0][1] as Record<string, unknown>;
    expect(fields).not.toHaveProperty("state");
  });

  it("surfaces save failures instead of failing silently", async () => {
    const user = userEvent.setup();
    vi.mocked(api.updateProject).mockRejectedValue(
      Object.assign(new Error("42501: permission denied"), { kind: "error" }),
    );
    renderView();

    const card = (await screen.findByLabelText(/Repository URL/)).closest(
      "form",
    ) as HTMLFormElement;
    await user.type(
      within(card).getByLabelText(/Repository URL/),
      "https://github.com/example/repo",
    );
    await user.click(within(card).getByRole("button", { name: "Save project" }));

    expect(await screen.findByText(/Saving failed/)).toBeInTheDocument();
  });
});
