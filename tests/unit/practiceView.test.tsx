/**
 * Practice view component tests (todo.md Task 12): session logging, outcome
 * capture, mock rubric scores (1-5), the latest-ten readiness window, and
 * dated correction tasks linked to their source session.
 */

import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PrepApi, PracticeSessionRow } from "../../src/lib/api";
import { PracticeView } from "../../src/views/PracticeView";

function session(overrides: Partial<PracticeSessionRow> = {}): PracticeSessionRow {
  return {
    id: "s1",
    session_type: "coding",
    date: "2026-08-31",
    state: "planned",
    completed_at: null,
    topic: "Graph traversal",
    allotted_minutes: 90,
    elapsed_minutes: null,
    result: null,
    mistake_category: null,
    correction_due_date: null,
    corrected_at: null,
    notes: "Reviewed approach, complexity, and edge cases.",
    evidence_url: null,
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
    fetchProfile: vi.fn().mockResolvedValue(null),
    fetchTasks: vi.fn().mockResolvedValue([]),
    fetchTaskEvents: vi.fn().mockResolvedValue([]),
    fetchPlanWeeks: vi.fn().mockResolvedValue([]),
    fetchProjects: vi.fn().mockResolvedValue([]),
    fetchMilestones: vi.fn().mockResolvedValue([]),
    fetchPracticeSessions: vi.fn().mockResolvedValue([]),
    fetchMockScores: vi.fn().mockResolvedValue([]),
    createPracticeSession: vi.fn(),
    updatePracticeSession: vi.fn().mockResolvedValue(undefined),
    saveMockScore: vi.fn().mockResolvedValue(undefined),
    createCorrectionTask: vi.fn(),
    fetchCheckin: vi.fn().mockResolvedValue(null),
    saveCheckin: vi.fn().mockResolvedValue(undefined),
    transition: vi.fn(),
    unlockPostTraining: vi.fn(),
    updateProject: vi.fn(),
    updateMilestone: vi.fn(),
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
      <PracticeView />
    </QueryClientProvider>,
  );
}

describe("PracticeView", () => {
  let api: PrepApi;

  beforeEach(() => {
    api = makeApiStub();
    apiStub.current = api;
  });

  it("shows the latest-ten readiness window with a count and empty state", async () => {
    renderView();
    expect(await screen.findByText("Build your readiness window")).toBeInTheDocument();
  });

  it("reports the 8-of-10 gate signal from qualifying sessions", async () => {
    vi.mocked(api.fetchPracticeSessions).mockResolvedValue(
      Array.from({ length: 10 }, (_, i) =>
        session({
          id: `s${i}`,
          date: "2026-08-31",
          state: "completed",
          completed_at: new Date(Date.UTC(2026, 7, 20 + i, 10)).toISOString(),
          result: i < 7 ? "solved" : "unsolved",
        }),
      ),
    );
    renderView();

    expect(await screen.findByText("7/10", { selector: "strong" })).toBeInTheDocument();
    expect(
      screen.getByText("1 more solved result needed to reach the signal."),
    ).toBeInTheDocument();
  });

  it("uses an accessible practice switcher and renders the latest ten as result cells", async () => {
    vi.mocked(api.fetchPracticeSessions).mockResolvedValue(
      Array.from({ length: 10 }, (_, i) =>
        session({
          id: `coding-${i}`,
          date: "2026-08-31",
          state: "completed",
          completed_at: new Date(Date.UTC(2026, 7, 20 + i, 10)).toISOString(),
          result: i < 8 ? "solved" : "unsolved",
        }),
      ),
    );
    renderView();

    expect(await screen.findByRole("tab", { name: "Coding" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Mocks" })).toBeInTheDocument();
    expect(await screen.findByRole("list", { name: "Latest ten coding results" })).toHaveAttribute(
      "aria-label",
      "Latest ten coding results",
    );
    expect(screen.getAllByRole("listitem", { name: /coding result/i })).toHaveLength(10);
  });

  it("exposes all bookmarked problems and creates a tracked attempt from the bank", async () => {
    const user = userEvent.setup();
    vi.mocked(api.createPracticeSession).mockResolvedValue(session());
    renderView();

    expect(await screen.findByText("Problem bank")).toBeInTheDocument();
    expect(screen.getByText((text) => text.includes("60 bookmarked problems"))).toBeInTheDocument();
    expect(screen.getAllByRole("article", { name: /Problem:/ })).toHaveLength(60);
    const problem = screen.getByRole("article", { name: "Problem: 3Sum" });
    await user.click(within(problem).getByRole("button", { name: "Plan attempt" }));

    await waitFor(() => {
      expect(api.createPracticeSession).toHaveBeenCalledWith(
        expect.objectContaining({
          session_type: "coding",
          topic: "3Sum [lc-3sum]",
          allotted_minutes: 40,
        }),
        expect.anything(),
      );
    });
  });

  it("creates a coding session through the validated form", async () => {
    const user = userEvent.setup();
    vi.mocked(api.createPracticeSession).mockResolvedValue(session());
    renderView();

    await user.click(await screen.findByRole("button", { name: "Log coding session" }));
    const form = document.querySelector("form.task-dialog") as HTMLFormElement;
    await user.type(within(form).getByLabelText("Topic"), "Intervals");
    await user.clear(within(form).getByLabelText("Allotted minutes"));
    await user.type(within(form).getByLabelText("Allotted minutes"), "120");
    await user.click(within(form).getByRole("button", { name: "Save session" }));

    // mutationFn receives (variables, context) - match both.
    expect(api.createPracticeSession).toHaveBeenCalledWith(
      expect.objectContaining({
        session_type: "coding",
        topic: "Intervals",
        allotted_minutes: 120,
      }),
      expect.anything(),
    );
  });

  it("does not count a coding outcome as complete until review notes are recorded", async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchPracticeSessions).mockResolvedValue([session()]);
    renderView();

    await user.type(await screen.findByLabelText("Elapsed minutes"), "40");
    await user.type(screen.getByLabelText(/Result/), "solved");
    await user.click(screen.getByRole("button", { name: "Mark completed" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Review notes must record the approach");
    expect(api.updatePracticeSession).not.toHaveBeenCalled();
  });

  it("completes a session with elapsed time, result, and mistake category", async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchPracticeSessions).mockResolvedValue([session()]);
    renderView();

    await user.type(await screen.findByLabelText("Elapsed minutes"), "85");
    await user.type(screen.getByLabelText(/Result/), "solved");
    await user.selectOptions(screen.getByLabelText(/Mistake category/), "reasoning");
    await user.type(
      screen.getByLabelText("Review notes"),
      "Missed a visited-set edge case; re-solve queued.",
    );
    await user.click(screen.getByRole("button", { name: "Mark completed" }));

    await waitFor(() => {
      expect(api.updatePracticeSession).toHaveBeenCalledWith(
        "s1",
        expect.objectContaining({
          state: "completed",
          elapsed_minutes: 85,
          result: "solved",
          mistake_category: "reasoning",
          notes: "Missed a visited-set edge case; re-solve queued.",
          completed_at: expect.any(String),
        }),
      );
    });
  });

  it("tracks a completed bookmarked problem as reviewed and re-solved", async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchPracticeSessions).mockResolvedValue([
      session({
        topic: "3Sum [lc-3sum]",
        state: "completed",
        completed_at: "2026-09-01T18:00:00Z",
        elapsed_minutes: 39,
        result: "solved",
        notes: "Reviewed complexity and duplicate handling.",
      }),
    ]);
    renderView();

    await screen.findByText("Reviewed");
    const problem = screen.getByRole("article", { name: "Problem: 3Sum" });
    expect(within(problem).getByText("Reviewed")).toBeInTheDocument();
    await user.click(within(problem).getByRole("button", { name: "Mark re-solved" }));

    await waitFor(() => {
      expect(api.updatePracticeSession).toHaveBeenCalledWith(
        "s1",
        expect.objectContaining({ corrected_at: expect.any(String) }),
      );
    });
  });

  it("saves normalized 1-5 rubric scores for completed mocks", async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchPracticeSessions).mockResolvedValue([
      session({
        id: "mock-1",
        session_type: "mock",
        topic: "System design: eval platform",
        state: "completed",
        completed_at: "2026-08-31T18:00:00Z",
        result: "completed",
      }),
    ]);
    renderView();

    await user.click(await screen.findByRole("tab", { name: "Mocks" }));
    const framing = await screen.findByLabelText(/Problem framing/);
    await user.selectOptions(framing, "4");
    await waitFor(() => {
      expect(api.saveMockScore).toHaveBeenCalledWith("mock-1", "problem_framing", 4);
    });

    await user.selectOptions(await screen.findByLabelText(/Integrity/), "5");
    await waitFor(() => {
      expect(api.saveMockScore).toHaveBeenCalledWith("mock-1", "integrity", 5);
    });
  });

  it("places a correction action beside low mock-rubric scores", async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchPracticeSessions).mockResolvedValue([
      session({
        id: "mock-low-score",
        session_type: "mock",
        topic: "Agent environment design",
        state: "completed",
        completed_at: "2026-08-31T18:00:00Z",
        result: "completed",
      }),
    ]);
    vi.mocked(api.fetchMockScores).mockResolvedValue([
      {
        practice_session_id: "mock-low-score",
        dimension_key: "communication",
        score: 2,
      },
    ] as Awaited<ReturnType<PrepApi["fetchMockScores"]>>);
    renderView();

    await user.click(await screen.findByRole("tab", { name: "Mocks" }));
    expect(
      await screen.findByRole("button", { name: "Create correction for Communication" }),
    ).toBeInTheDocument();
  });

  it("creates a dated correction task linked to the source session", async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchPracticeSessions).mockResolvedValue([
      session({
        id: "mock-1",
        session_type: "mock",
        topic: "System design: eval platform",
        state: "completed",
        completed_at: "2026-08-31T18:00:00Z",
        result: "completed",
        correction_due_date: "2026-09-03",
      }),
    ]);
    vi.mocked(api.createCorrectionTask).mockResolvedValue({
      ...session(),
      id: "correction-1",
    } as unknown as import("../../src/lib/api").TaskRow);
    renderView();

    await user.click(await screen.findByRole("tab", { name: "Mocks" }));
    const button = await screen.findByRole("button", { name: /create dated correction task/ });
    await user.click(button);

    await waitFor(() => {
      expect(api.createCorrectionTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Correction: System design: eval platform",
          scheduled_date: "2026-09-03",
          source_practice_session_id: "mock-1",
        }),
        expect.anything(),
      );
    });
  });
});
