/**
 * Readiness view component tests (todo.md Task 13): distinct role gate sets,
 * explicit assessment with required evidence for ready state, HTTPS
 * validation, and no invented composite score.
 */

import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PrepApi, ReadinessGateRow } from "../../src/lib/api";
import { ReadinessView } from "../../src/views/ReadinessView";

function gate(overrides: Partial<ReadinessGateRow> = {}): ReadinessGateRow {
  return {
    id: "g1",
    role_key: "data_eval",
    gate_key: "resume",
    title: "Resume gate: evidence for 80% of core requirements",
    state: "not_assessed",
    evidence_note: null,
    evidence_url: null,
    assessed_at: null,
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
      post_training_enabled: true,
      template_version: 1,
    }),
    fetchTasks: vi.fn().mockResolvedValue([]),
    fetchTaskEvents: vi.fn().mockResolvedValue([]),
    fetchPlanWeeks: vi.fn().mockResolvedValue([]),
    fetchProjects: vi.fn().mockResolvedValue([]),
    fetchMilestones: vi.fn().mockResolvedValue([]),
    fetchPracticeSessions: vi.fn().mockResolvedValue([]),
    fetchMockScores: vi.fn().mockResolvedValue([]),
    fetchReadinessGates: vi.fn().mockResolvedValue([
      gate(),
      gate({ id: "g2", role_key: "data_eval", gate_key: "evaluation", title: "Evaluation gate" }),
      gate({ id: "g3", role_key: "agent_env", gate_key: "coding", title: "Coding gate" }),
      gate({
        id: "g4",
        role_key: "post_training",
        gate_key: "pt_ownership",
        title: "Ownership evidence gate",
      }),
    ]),
    ...overrides,
    updateReadinessGate: vi.fn().mockResolvedValue(undefined),
    createPracticeSession: vi.fn(),
    updatePracticeSession: vi.fn(),
    saveMockScore: vi.fn(),
    createCorrectionTask: vi.fn(),
    fetchCheckin: vi.fn().mockResolvedValue(null),
    saveCheckin: vi.fn().mockResolvedValue(undefined),
    transition: vi.fn(),
    unlockPostTraining: vi.fn(),
    updateProject: vi.fn(),
    updateMilestone: vi.fn(),
    seedPlan: vi.fn(),
  } as unknown as PrepApi;
}

function renderView() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ReadinessView />
    </QueryClientProvider>,
  );
}

describe("ReadinessView", () => {
  let api: PrepApi;

  beforeEach(() => {
    api = makeApiStub();
    apiStub.current = api;
  });

  it("renders distinct role cards with their own gates", async () => {
    renderView();

    expect(
      await screen.findByRole("heading", { name: /MTS, Data Analysis and Evaluation/ }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: /MTS, Agent Environments/ }),
    ).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: /MTS, Post-Training/ })).toBeInTheDocument();
    expect(await screen.findByText("Coding gate")).toBeInTheDocument();
    expect(screen.getByText("Ownership evidence gate")).toBeInTheDocument();
  });

  it("keeps gate assessment controls closed until a gate is selected", async () => {
    const user = userEvent.setup();
    renderView();

    const gateCard = (
      await screen.findByText("Resume gate: evidence for 80% of core requirements")
    ).closest("form") as HTMLFormElement;
    expect(within(gateCard).queryByLabelText("Assessment")).not.toBeInTheDocument();

    await user.click(within(gateCard).getByRole("button", { name: "Assess gate" }));
    expect(within(gateCard).getByLabelText("Assessment")).toBeInTheDocument();
    expect(within(gateCard).getByRole("button", { name: "Close assessment" })).toBeInTheDocument();
  });

  it("refuses ready without evidence but saves with a note", async () => {
    const user = userEvent.setup();
    renderView();

    const form = (
      await screen.findByText("Resume gate: evidence for 80% of core requirements")
    ).closest("form") as HTMLFormElement;
    await user.click(within(form).getByRole("button", { name: "Assess gate" }));
    await user.selectOptions(within(form).getByLabelText("Assessment"), "ready");
    await user.click(within(form).getByRole("button", { name: "Save assessment" }));

    expect(
      await within(form).findByText(/requires a note or an HTTPS evidence link/),
    ).toBeInTheDocument();
    expect(api.updateReadinessGate).not.toHaveBeenCalled();

    await user.type(
      within(form).getByLabelText("Evidence note"),
      "Reviewer confirmed 9 of 10 rows",
    );
    await user.click(within(form).getByRole("button", { name: "Save assessment" }));

    await waitFor(() => {
      expect(api.updateReadinessGate).toHaveBeenCalledWith(
        "g1",
        expect.objectContaining({
          state: "ready",
          evidence_note: "Reviewer confirmed 9 of 10 rows",
          assessed_at: expect.any(String),
        }),
      );
    });
  });

  it("rejects non-HTTPS evidence links", async () => {
    const user = userEvent.setup();
    renderView();

    const form = (
      await screen.findByText("Resume gate: evidence for 80% of core requirements")
    ).closest("form") as HTMLFormElement;
    await user.click(within(form).getByRole("button", { name: "Assess gate" }));
    await user.selectOptions(within(form).getByLabelText("Assessment"), "ready");
    await user.type(
      within(form).getByLabelText("Evidence link (HTTPS)"),
      "http://insecure.example",
    );
    await user.click(within(form).getByRole("button", { name: "Save assessment" }));

    expect(await screen.findByText(/Evidence links must use HTTPS/)).toBeInTheDocument();
    expect(api.updateReadinessGate).not.toHaveBeenCalled();
  });
});
