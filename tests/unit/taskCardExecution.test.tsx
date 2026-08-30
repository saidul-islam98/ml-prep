import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TaskCard } from "../../src/components/TaskCard";
import type { PrepApi, TaskRow, TransitionOutcome } from "../../src/lib/api";

const api = vi.hoisted(() => ({
  fetchTaskExecution: vi.fn().mockResolvedValue(null),
  saveTaskExecution: vi.fn(),
}));

vi.mock("../../src/hooks/useApi", () => ({
  useApi: () => api as unknown as PrepApi,
}));

function row(state: TaskRow["state"] = "not_started"): TaskRow {
  return {
    id: "task-1",
    user_id: "user-1",
    source_week_number: 1,
    template_task_key: "w01-mon",
    title: "Timed Python coding baseline and mistake log",
    description: null,
    acceptance_note: null,
    category: "practice",
    role_tags: ["data_eval", "agent_env"],
    project_id: null,
    original_scheduled_date: "2026-08-31",
    scheduled_date: "2026-08-31",
    estimated_minutes: 120,
    actual_minutes: null,
    revision: 0,
    state,
    completed_at: null,
    skip_reason: null,
    evidence_url: "https://example.com/prior",
    evidence_note: "existing evidence",
    source_practice_session_id: null,
  };
}

function renderCard(task: TaskRow, onTransition: ReturnType<typeof vi.fn>) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TaskCard task={task} onTransition={onTransition} />
    </QueryClientProvider>,
  );
}

describe("curriculum task completion routes", () => {
  it("routes the visible Complete action through the gate and preserves evidence separately from override", async () => {
    const user = userEvent.setup();
    const onTransition = vi.fn().mockResolvedValue({
      outcome: "ok",
      task: { ...row(), state: "completed", revision: 1 },
    } satisfies TransitionOutcome);
    renderCard(row(), onTransition);

    await user.click(screen.getByRole("button", { name: "Complete" }));
    const gate = screen.getByRole("dialog", { name: "Verify Definition of Done" });
    expect(within(gate).getByText("Some required criteria are not checked")).toBeInTheDocument();

    await user.type(
      within(gate).getByLabelText("Required override rationale"),
      "Equivalent timed session is linked",
    );
    await user.clear(within(gate).getByLabelText("Actual minutes"));
    await user.type(within(gate).getByLabelText("Actual minutes"), "87");
    await user.click(within(gate).getByRole("button", { name: "Override & Complete Task" }));

    await waitFor(() =>
      expect(onTransition).toHaveBeenCalledWith(
        expect.objectContaining({ id: "task-1" }),
        "complete",
        expect.objectContaining({
          actual_minutes: 87,
          evidence_url: "https://example.com/prior",
          evidence_note: "existing evidence",
          completion_gate_verified: false,
          completion_override_reason: "Equivalent timed session is linked",
        }),
      ),
    );
  });

  it("starts a not-started task before opening focus mode", async () => {
    const user = userEvent.setup();
    const onTransition = vi.fn().mockResolvedValue({
      outcome: "ok",
      task: { ...row(), state: "in_progress", revision: 1 },
    } satisfies TransitionOutcome);
    renderCard(row(), onTransition);

    await user.click(screen.getByRole("button", { name: /Launch focus mode for/ }));
    await waitFor(() =>
      expect(onTransition).toHaveBeenCalledWith(
        expect.objectContaining({ id: "task-1" }),
        "start",
        undefined,
      ),
    );
    expect(
      await screen.findByRole("dialog", { name: "Timed Python coding baseline and mistake log" }),
    ).toBeInTheDocument();
  });
});
