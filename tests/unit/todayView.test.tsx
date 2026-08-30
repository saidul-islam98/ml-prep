/**
 * Today view component tests (todo.md Task 8): Toronto-aware groups and
 * minutes, the completion flow through the RPC boundary, visible error and
 * stale-conflict handling, offline read-only behavior, and the blocking
 * overdue queue (Task 9).
 */

import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PrepApi, TaskRow, TransitionOutcome } from "../../src/lib/api";
import { TodayView } from "../../src/views/TodayView";

function task(overrides: Partial<TaskRow> = {}): TaskRow {
  return {
    id: "task-1",
    user_id: "user-1",
    source_week_number: 1,
    template_task_key: "w01-mon",
    title: "Timed Python + review",
    description: null,
    acceptance_note: "Two focused solutions with tests",
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

const TODAY = "2026-08-31";

// Freeze "today" at the canonical window start and share a mutable API stub.
vi.mock("../../src/lib/toronto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/lib/toronto")>();
  return {
    ...actual,
    torontoToday: () => TODAY,
    // Freeze the wall clock at midday so the end-of-day check-in starts
    // collapsed regardless of when CI runs (it auto-opens after 5 PM).
    torontoParts: (instant: Date) => ({ ...actual.torontoParts(instant), hour: 12 }),
  };
});

const apiStub = vi.hoisted(() => ({
  current: null as unknown as PrepApi,
}));

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
    ]),
    fetchProjects: vi.fn().mockResolvedValue([]),
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
      <TodayView />
    </QueryClientProvider>,
  );
}

describe("TodayView", () => {
  let api: PrepApi;

  beforeEach(() => {
    api = makeApiStub();
    apiStub.current = api;
  });

  it("shows today's date, week, and minutes summary", async () => {
    vi.mocked(api.fetchTasks).mockResolvedValue([
      task(),
      task({
        id: "task-2",
        template_task_key: "w01-tue",
        title: "Agent-eval design baseline",
        category: "deep_work",
        scheduled_date: TODAY,
        estimated_minutes: 90,
        state: "completed",
        actual_minutes: 85,
        completed_at: "2026-08-31T15:00:00Z",
      }),
    ]);
    renderView();

    expect(await screen.findByText("Mon, Aug 31, 2026")).toBeInTheDocument();
    expect(await screen.findByText(/Week 1 of 14/)).toBeInTheDocument();
    expect(
      screen.getByText(/85 of 210 planned minutes done - 1\/2 tasks completed/),
    ).toBeInTheDocument();
  });

  it("groups tasks by category with headings", async () => {
    vi.mocked(api.fetchTasks).mockResolvedValue([
      task(),
      task({ id: "task-2", template_task_key: "w01-tue", category: "deep_work", title: "Theory" }),
    ]);
    renderView();

    expect(await screen.findByRole("heading", { name: "Practice" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Deep work" })).toBeInTheDocument();
    expect(screen.getByText("Timed Python + review")).toBeInTheDocument();
    expect(screen.getByText("Theory")).toBeInTheDocument();
  });

  it("frames the first incomplete task as the next training rep", async () => {
    vi.mocked(api.fetchTasks).mockResolvedValue([
      task({ title: "First rep" }),
      task({
        id: "task-2",
        template_task_key: "w01-tue",
        title: "Completed rep",
        state: "completed",
      }),
    ]);
    renderView();

    expect(await screen.findByText("Next training rep")).toBeInTheDocument();
    expect(screen.getByText("First rep")).toBeInTheDocument();
  });

  it("completes a task with actual minutes and HTTPS evidence", async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchTasks).mockResolvedValue([task({ template_task_key: null })]);
    vi.mocked(api.transition).mockResolvedValue({
      outcome: "ok",
      task: task({
        state: "completed",
        revision: 1,
        actual_minutes: 100,
        completed_at: "2026-08-31T16:00:00Z",
      }),
    } satisfies TransitionOutcome);
    renderView();

    await screen.findByText("Timed Python + review");
    await user.click(screen.getByRole("button", { name: "Complete" }));
    await user.clear(screen.getByLabelText("Actual minutes"));
    await user.type(screen.getByLabelText("Actual minutes"), "100");
    await user.type(
      screen.getByLabelText("Evidence link (optional, HTTPS)"),
      "https://github.com/example/commit/1",
    );
    await user.click(screen.getByRole("button", { name: "Save completion" }));

    await waitFor(() => {
      expect(api.transition).toHaveBeenCalledWith(
        "task-1",
        0,
        "complete",
        expect.objectContaining({
          actual_minutes: 100,
          evidence_url: "https://github.com/example/commit/1",
        }),
      );
    });
  });

  it("rejects non-HTTPS evidence client-side with a visible message", async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchTasks).mockResolvedValue([task({ template_task_key: null })]);
    renderView();

    await screen.findByText("Timed Python + review");
    await user.click(screen.getByRole("button", { name: "Complete" }));
    await user.type(
      screen.getByLabelText("Evidence link (optional, HTTPS)"),
      "http://insecure.example/x",
    );
    await user.click(screen.getByRole("button", { name: "Save completion" }));

    expect(await screen.findByText(/Evidence links must use HTTPS/)).toBeInTheDocument();
    expect(api.transition).not.toHaveBeenCalled();
  });

  it("surfaces a stale-revision conflict with refresh/retry controls", async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchTasks).mockResolvedValue([task({ template_task_key: null })]);
    vi.mocked(api.transition).mockResolvedValueOnce({
      outcome: "conflict",
      task: task({ revision: 3, state: "in_progress" }),
    } satisfies TransitionOutcome);
    renderView();

    await screen.findByText("Timed Python + review");
    await user.click(screen.getByRole("button", { name: "Complete" }));
    await user.click(screen.getByRole("button", { name: "Save completion" }));

    expect(await screen.findByText(/changed on another device/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Discard my change" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply to latest" })).toBeInTheDocument();
    expect(api.transition).toHaveBeenCalledTimes(1);
  });

  it("shows a visible error and no false success when the mutation fails", async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchTasks).mockResolvedValue([task()]);
    vi.mocked(api.transition).mockRejectedValue(
      Object.assign(new Error("invalid_transition: ..."), { kind: "invalid_transition" }),
    );
    renderView();

    await screen.findByText("Timed Python + review");
    await user.click(screen.getByRole("button", { name: "Start" }));

    expect(await screen.findByText(/That action isn't available/)).toBeInTheDocument();
  });

  it("renders read-only controls when the browser reports offline", async () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(window, "navigator");
    Object.defineProperty(window, "navigator", {
      value: { ...navigator, onLine: false },
      configurable: true,
    });
    try {
      vi.mocked(api.fetchTasks).mockResolvedValue([task()]);
      renderView();

      await screen.findByText("Timed Python + review");
      expect(screen.getByRole("button", { name: "Start" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Complete" })).toBeDisabled();
      expect(screen.getAllByText(/read-only/i).length).toBeGreaterThan(0);
      expect(api.transition).not.toHaveBeenCalled();
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(window, "navigator", originalDescriptor);
      }
    }
  });

  it("shows an empty state when nothing is scheduled today", async () => {
    renderView();
    expect(await screen.findByText("No tasks scheduled for today")).toBeInTheDocument();
  });

  it("offers the end-of-day check-in on demand and saves both fields", async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(await screen.findByRole("button", { name: "Open check-in" }));
    await user.type(
      screen.getByLabelText("One short learning"),
      "Bootstrap CIs need paired samples",
    );
    await user.type(
      screen.getByLabelText("Next day's highest-risk gap"),
      "Project 2 runner design",
    );
    await user.click(screen.getByRole("button", { name: "Save check-in" }));

    await waitFor(() => {
      expect(api.saveCheckin).toHaveBeenCalledWith({
        local_date: TODAY,
        learning: "Bootstrap CIs need paired samples",
        highest_risk_gap: "Project 2 runner design",
      });
    });
  });
});

describe("OverdueQueue (Task 9)", () => {
  it("renders the blocking queue with original date and requires explicit resolution", async () => {
    const user = userEvent.setup();
    apiStub.current = makeApiStub({
      fetchTasks: vi.fn().mockResolvedValue([
        task({
          id: "overdue-1",
          template_task_key: "w01-wed",
          title: "Overdue requirement rows",
          category: "application",
          scheduled_date: "2026-08-30",
          original_scheduled_date: "2026-08-30",
          state: "not_started",
        }),
        task({
          id: "today-1",
          template_task_key: "w01-mon",
          title: "Today task",
          scheduled_date: TODAY,
        }),
      ]),
      fetchTaskEvents: vi.fn().mockResolvedValue([
        {
          id: "e1",
          event_type: "rescheduled",
          occurred_at: "2026-08-31T12:00:00Z",
          from_scheduled_date: "2026-08-29",
          to_scheduled_date: "2026-08-30",
          metadata: {},
        },
      ]),
      transition: vi.fn().mockResolvedValue({
        outcome: "ok",
        task: task({
          id: "overdue-1",
          state: "not_started",
          revision: 1,
          scheduled_date: "2026-09-01",
        }),
      } satisfies TransitionOutcome),
    });

    renderView();

    expect(await screen.findByText("Unresolved overdue work (1)")).toBeInTheDocument();
    expect(await screen.findByText(/Originally 2026-08-30 - rescheduled 1x/)).toBeInTheDocument();
    expect(screen.getByText("Overdue requirement rows")).toBeInTheDocument();

    // Reschedule now lives in the overdue card's overflow menu.
    await user.click(
      screen.getByRole("button", { name: "More actions for Overdue requirement rows" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Reschedule" }));
    const dialog = document.querySelector("form.task-dialog")!;
    await user.click(within(dialog as HTMLElement).getByRole("button", { name: "Reschedule" }));
    await waitFor(() => {
      expect(apiStub.current.transition).toHaveBeenCalledWith(
        "overdue-1",
        0,
        "reschedule",
        expect.objectContaining({ to_date: expect.any(String) }),
      );
    });
  });

  it("dismisses the queue for the session while the task stays overdue", async () => {
    const user = userEvent.setup();
    apiStub.current = makeApiStub({
      fetchTasks: vi.fn().mockResolvedValue([
        task({
          id: "overdue-1",
          template_task_key: "w01-wed",
          title: "Overdue requirement rows",
          category: "application",
          scheduled_date: "2026-08-30",
          original_scheduled_date: "2026-08-30",
          state: "not_started",
        }),
        task({
          id: "overdue-2",
          template_task_key: "w01-thu",
          title: "Second overdue task",
          category: "review",
          scheduled_date: "2026-08-29",
          original_scheduled_date: "2026-08-29",
          state: "not_started",
        }),
        task({
          id: "today-1",
          template_task_key: "w01-mon",
          title: "Today task",
          scheduled_date: TODAY,
        }),
      ]),
    });

    renderView();

    expect(await screen.findByText("Unresolved overdue work (2)")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Show next/ }));
    // Dismiss the second task as well: the queue then yields its session
    // note while both tasks remain overdue below.
    const again = await screen.findByRole("button", { name: /Show next/ });
    await user.click(again);
    expect(await screen.findByText(/Queue dismissed for this session/)).toBeInTheDocument();
    // The overdue task itself is still rendered below the queue.
    expect(screen.getByText("Overdue requirement rows")).toBeInTheDocument();
  });
});
