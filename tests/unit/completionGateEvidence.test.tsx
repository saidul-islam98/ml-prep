import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompletionGateModal } from "../../src/components/CompletionGateModal";
import { getCurriculumTask } from "../../src/curriculum";
import type { CurriculumTask } from "../../src/curriculum/schemas";

function gateTask(key: string): CurriculumTask {
  const task = getCurriculumTask(key);
  if (!task) throw new Error(`missing curriculum task ${key}`);
  return task;
}

function renderGate(task: CurriculumTask, onConfirmComplete: ReturnType<typeof vi.fn>) {
  return render(
    <CompletionGateModal
      task={task}
      isOpen
      onClose={vi.fn()}
      onConfirmComplete={onConfirmComplete}
    />,
  );
}

async function checkAllCriteria(user: ReturnType<typeof userEvent.setup>) {
  const dialog = screen.getByRole("dialog", { name: "Verify Definition of Done" });
  const boxes = within(dialog).getAllByRole("checkbox");
  for (const box of boxes) {
    if (!(box as HTMLInputElement).checked) await user.click(box);
  }
  return dialog;
}

describe("tiered evidence enforcement in the completion gate", () => {
  it("requires an evidence reference and explicit verification for every required deliverable", async () => {
    const user = userEvent.setup();
    const onConfirmComplete = vi.fn();
    renderGate(gateTask("w02-tue"), onConfirmComplete);

    const dialog = await checkAllCriteria(user);
    expect(within(dialog).getByText("Required deliverables")).toBeInTheDocument();
    expect(within(dialog).getByText(/Each required deliverable needs/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Confirm & Complete Task" }));
    expect(
      within(dialog).getByText(
        "This task requires evidence. Add a concrete reference for every required deliverable.",
      ),
    ).toBeInTheDocument();
    expect(onConfirmComplete).not.toHaveBeenCalled();

    // A generic task-level note is not evidence for the named deliverable.
    await user.type(
      within(dialog).getByLabelText("Evidence note"),
      "Confirmation archived in applications log",
    );
    await user.click(within(dialog).getByRole("button", { name: "Confirm & Complete Task" }));
    expect(onConfirmComplete).not.toHaveBeenCalled();

    await user.type(
      within(dialog).getByLabelText("Evidence for Submitted Agentic Environments application"),
      "applications/agentic/confirmation-2026-09-08.pdf",
    );
    await user.click(within(dialog).getByRole("button", { name: "Confirm & Complete Task" }));

    expect(onConfirmComplete).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        evidenceNote: "Confirmation archived in applications log",
        completedCriterionIds: expect.arrayContaining(["deliverable:w02-tue-d1"]),
      }),
    );
  });

  it("accepts a deliverable reference with an HTTPS task link", async () => {
    const user = userEvent.setup();
    const onConfirmComplete = vi.fn();
    renderGate(gateTask("w06-sat"), onConfirmComplete);

    const dialog = await checkAllCriteria(user);
    await user.type(
      within(dialog).getByLabelText("Evidence for Project 1 v0.1 release"),
      "GitHub release v0.1 and demo recording",
    );
    await user.type(
      within(dialog).getByLabelText("Evidence URL (HTTPS)"),
      "https://github.com/example/repo/releases/tag/v0.1",
    );
    await user.click(within(dialog).getByRole("button", { name: "Confirm & Complete Task" }));

    expect(onConfirmComplete).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ evidenceUrl: "https://github.com/example/repo/releases/tag/v0.1" }),
    );
  });

  it("rejects a non-HTTPS link on evidence-required tasks", async () => {
    const user = userEvent.setup();
    const onConfirmComplete = vi.fn();
    renderGate(gateTask("w11-sat"), onConfirmComplete);

    const dialog = await checkAllCriteria(user);
    await user.type(
      within(dialog).getByLabelText("Evidence URL (HTTPS)"),
      "http://example.com/report",
    );
    await user.click(within(dialog).getByRole("button", { name: "Confirm & Complete Task" }));

    expect(within(dialog).getByText("Evidence links must use HTTPS.")).toBeInTheDocument();
    expect(onConfirmComplete).not.toHaveBeenCalled();
  });

  it("requires persisted deliverable verification but keeps its reference optional for unflagged tasks", async () => {
    const user = userEvent.setup();
    const onConfirmComplete = vi.fn();
    renderGate(gateTask("w02-mon"), onConfirmComplete);

    const dialog = await checkAllCriteria(user);
    expect(within(dialog).getByText("Required deliverables")).toBeInTheDocument();
    expect(within(dialog).getByText(/Evidence references are optional/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Confirm & Complete Task" }));

    expect(onConfirmComplete).toHaveBeenCalledTimes(1);
  });
});
