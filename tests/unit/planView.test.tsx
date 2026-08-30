/**
 * Plan view component tests (todo.md Task 10): date-based week grouping
 * (source_week_number is provenance only), filters, custom task creation,
 * and custom-task edit/archive with reasons.
 */

import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PrepApi, TaskRow } from "../../src/lib/api";
import { PlanView } from "../../src/views/PlanView";

function task(overrides: Partial<TaskRow> = {}): TaskRow {
  return {
    id: "task-1",
    user_id: "user-1",
    source_week_number: 1,
    template_task_key: "w01-mon",
    title: "Timed Python + review",
    description: null,
    acceptance_note: null,
    category: "practice",
    role_tags: ["data_eval"],
    project_id: null,
    original_scheduled_date: "2026-08-31",
    scheduled_date: "2026-08-31",
    estimated_minutes: 120,
    actual_minutes: null,
    revision: 0,
    state: "not_started",
    completed_at: null,
    skip_reason: null,
    evidence_url: null,
    evidence_note: null,
    source_practice_session_id: null,
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
    fetchPlanWeeks: vi.fn().mockResolvedValue([
      {
        id: "week-1",
        week_number: 1,
        title: "Positioning and baselines",
        start_date: "2026-08-31",
        end_date: "2026-09-06",
        phase: "Application sprint",
        exit_check: "Data/Eval application submitted",
      },
      {
        id: "week-2",
        week_number: 2,
        title: "Application sprint",
        start_date: "2026-09-07",
        end_date: "2026-09-13",
        phase: "Application sprint",
        exit_check: "Both applications submitted",
      },
    ]),
    fetchProjects: vi.fn().mockResolvedValue([
      {
        id: "proj-1",
        project_key: "evalops",
        name: "EvalOps for tool-using enterprise agents",
        target_roles: ["data_eval"],
        budget_minutes: 1950,
        state: "active",
        blocker_note: null,
      },
    ]),
    fetchCheckin: vi.fn().mockResolvedValue(null),
    saveCheckin: vi.fn().mockResolvedValue(undefined),
    createCustomTask: vi.fn(),
    transition: vi.fn(),
    unlockPostTraining: vi.fn(),
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
      <PlanView />
    </QueryClientProvider>,
  );
}

describe("PlanView", () => {
  let api: PrepApi;

  beforeEach(() => {
    api = makeApiStub();
    apiStub.current = api;
  });

  async function expandWeek(label: string) {
    const user = userEvent.setup();
    const toggle = await screen.findByRole("button", { name: new RegExp(label) });
    // Week 1 starts open; only click when collapsed so this helper opens.
    if (toggle.getAttribute("aria-expanded") !== "true") {
      await user.click(toggle);
    }
  }

  it("groups tasks by scheduled date into weeks: a rescheduled task moves weeks", async () => {
    vi.mocked(api.fetchTasks).mockResolvedValue([
      task({
        id: "moved",
        template_task_key: "w01-mon",
        title: "Rescheduled into week 2",
        original_scheduled_date: "2026-08-31",
        scheduled_date: "2026-09-09", // rescheduled into week 2
        source_week_number: 1,
      }),
    ]);
    renderView();

    await expandWeek("Week 2:");
    expect(await screen.findByText("Rescheduled into week 2")).toBeInTheDocument();
    await expandWeek("Week 1:");
    const week1 = document.getElementById("week-1")!.closest("section")!;
    const week2 = document.getElementById("week-2")!.closest("section")!;
    expect(within(week1).queryByText("Rescheduled into week 2")).not.toBeInTheDocument();
    expect(within(week2).getByText("Rescheduled into week 2")).toBeInTheDocument();
  });

  it("shows custom tasks (no source week) in the week of their scheduled date", async () => {
    vi.mocked(api.fetchTasks).mockResolvedValue([
      task({
        id: "custom-1",
        template_task_key: null,
        source_week_number: null,
        title: "Custom prep task",
        scheduled_date: "2026-09-10",
      }),
    ]);
    renderView();

    await expandWeek("Week 2:");
    expect(await screen.findByText("Custom prep task")).toBeInTheDocument();
  });

  it("renders the weekly exit check and progress summary", async () => {
    vi.mocked(api.fetchTasks).mockResolvedValue([
      task({
        state: "completed",
        actual_minutes: 110,
        completed_at: "2026-08-31T18:00:00Z",
      }),
      task({ id: "task-2", template_task_key: "w01-tue", estimated_minutes: 80 }),
    ]);
    renderView();

    await expandWeek("Week 1:");
    expect(
      await screen.findByText(/Exit check: Data\/Eval application submitted/),
    ).toBeInTheDocument();
    expect(screen.getByText(/110\/200 min completed/)).toBeInTheDocument();
  });

  it("frames weeks as numbered curriculum chapters", async () => {
    renderView();

    expect(await screen.findByText("14-week curriculum")).toBeInTheDocument();
    expect(await screen.findByText("Chapter 1")).toBeInTheDocument();
  });

  it("exposes the comprehensive resource guide and weekly primary references", async () => {
    renderView();

    expect(
      await screen.findByRole("heading", { name: "Comprehensive study resources" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Supplemental 12-week guide")).toBeInTheDocument();
    const cs336Links = await screen.findAllByRole("link", { name: "Stanford CS336" });
    expect(cs336Links[0]).toHaveAttribute("href", "https://cs336.stanford.edu/");
    expect(cs336Links[0]).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getAllByText("MUST").length).toBeGreaterThan(0);
  });

  it("filters by role, category, and state", async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchTasks).mockResolvedValue([
      task({ id: "a", title: "Agent task", role_tags: ["agent_env"] }),
      task({
        id: "b",
        title: "Eval task",
        role_tags: ["data_eval"],
        state: "completed",
        completed_at: "2026-08-31T18:00:00Z",
      }),
    ]);
    renderView();
    await expandWeek("Week 1:");

    await user.selectOptions(screen.getByLabelText("Role"), "agent_env");
    expect(await screen.findByText("Agent task")).toBeInTheDocument();
    expect(screen.queryByText("Eval task")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Role"), "all");
    await user.selectOptions(screen.getByLabelText("State"), "completed");
    expect(await screen.findByText("Eval task")).toBeInTheDocument();
    expect(screen.queryByText("Agent task")).not.toBeInTheDocument();
  });

  it("excludes optional Post-Training tasks until the track is enabled", async () => {
    vi.mocked(api.fetchTasks).mockResolvedValue([
      task({
        id: "pt-1",
        template_task_key: "pt-w9-scope",
        title: "Project 3: scope",
        role_tags: ["post_training"],
      }),
    ]);
    renderView();
    await expandWeek("Week 1:");
    await waitFor(() => {
      expect(screen.queryByText("Project 3: scope")).not.toBeInTheDocument();
    });

    // Enable the track: the optional task becomes visible.
    apiStub.current = makeApiStub({
      fetchTasks: vi.mocked(api.fetchTasks),
      fetchProfile: vi.fn().mockResolvedValue({
        user_id: "user-1",
        timezone: "America/Toronto",
        reminder_local_time: "17:00",
        reminder_installed_at: null,
        reminder_verified_at: null,
        post_training_enabled: true,
        template_version: 1,
      }),
    });
    renderView();
    await expandWeek("Week 1:");
    expect(await screen.findByText("Project 3: scope")).toBeInTheDocument();
  });

  it("creates a custom task through the validated form", async () => {
    const user = userEvent.setup();
    vi.mocked(api.createCustomTask).mockResolvedValue(
      task({ id: "new", template_task_key: null, title: "New custom task" }),
    );
    renderView();

    await user.click(screen.getByRole("button", { name: "Add custom task" }));
    const form = document.querySelector("form.task-dialog") as HTMLFormElement;
    await user.type(within(form).getByLabelText("Title"), "Drill recruiter questions");
    await user.selectOptions(within(form).getByLabelText("Category"), "application");
    await user.clear(within(form).getByLabelText("Estimated minutes"));
    await user.type(within(form).getByLabelText("Estimated minutes"), "45");
    await user.click(within(form).getByRole("button", { name: "Create task" }));

    await waitFor(() => {
      expect(api.createCustomTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Drill recruiter questions",
          category: "application",
          estimated_minutes: 45,
        }),
      );
    });
  });

  it("shows a validation error for a non-positive estimate without calling the API", async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole("button", { name: "Add custom task" }));
    const form = document.querySelector("form.task-dialog") as HTMLFormElement;
    await user.type(within(form).getByLabelText("Title"), "Bad task");
    await user.clear(within(form).getByLabelText("Estimated minutes"));
    await user.type(within(form).getByLabelText("Estimated minutes"), "0");
    await user.click(within(form).getByRole("button", { name: "Create task" }));

    try {
      await screen.findByText(/Estimated minutes must be a positive whole number/, undefined, {
        timeout: 800,
      });
    } catch (e) {
      console.log("DEBUG BODY:", document.body.textContent?.slice(0, 900));
      throw e;
    }
    expect(api.createCustomTask).not.toHaveBeenCalled();
  });

  it("edits and archives a custom task with a required reason; template tasks get neither control", async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchTasks).mockResolvedValue([
      task({
        id: "custom",
        template_task_key: null,
        title: "Custom task",
        scheduled_date: "2026-08-31",
      }),
      task({ id: "template", template_task_key: "w01-mon", title: "Template task" }),
    ]);
    vi.mocked(api.transition).mockResolvedValue({
      outcome: "ok",
      task: task({ id: "custom", template_task_key: null, revision: 1, title: "Renamed custom" }),
    } satisfies import("../../src/lib/api").TransitionOutcome);
    renderView();
    await expandWeek("Week 1:");

    const customCard = screen.getByLabelText("Task: Custom task").closest("article") as HTMLElement;
    await user.click(
      within(customCard).getByRole("button", { name: "More actions for Custom task" }),
    );
    await user.click(within(customCard).getByRole("menuitem", { name: "Edit task" }));
    await user.clear(within(customCard).getByLabelText("Title"));
    await user.type(within(customCard).getByLabelText("Title"), "Renamed custom");
    await user.click(within(customCard).getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(api.transition).toHaveBeenCalledWith(
        "custom",
        0,
        "edit",
        expect.objectContaining({ title: "Renamed custom" }),
      );
    });

    // Archive requires a reason and lives in the overflow menu.
    await user.click(
      within(customCard).getByRole("button", { name: "More actions for Custom task" }),
    );
    await user.click(within(customCard).getByRole("menuitem", { name: "Archive" }));
    await user.click(within(customCard).getByRole("button", { name: "Archive task" }));
    expect(await screen.findByText(/An archive reason is required/)).toBeInTheDocument();

    // Template card has neither Edit task nor Archive.
    const templateCard = screen
      .getByLabelText("Task: Template task")
      .closest("article") as HTMLElement;
    const templateMenu = within(templateCard).getByRole("button", {
      name: "More actions for Template task",
    });
    await user.click(templateMenu);
    expect(screen.queryByRole("menuitem", { name: "Edit task" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Archive" })).not.toBeInTheDocument();
  });
});
