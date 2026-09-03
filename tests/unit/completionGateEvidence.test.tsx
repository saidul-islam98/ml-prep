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
  it("blocks completion of an evidence-required task until a link or note is present", async () => {
    const user = userEvent.setup();
    const onConfirmComplete = vi.fn();
    renderGate(gateTask("w02-tue"), onConfirmComplete);

    const dialog = await checkAllCriteria(user);
    expect(within(dialog).getByText("Required deliverables")).toBeInTheDocument();
    expect(within(dialog).getByText(/Completing this task requires evidence/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Confirm & Complete Task" }));
    expect(
      within(dialog).getByText(
        "This task requires evidence. Add an HTTPS link or a note describing where each required deliverable lives.",
      ),
    ).toBeInTheDocument();
    expect(onConfirmComplete).not.toHaveBeenCalled();

    await user.type(
      within(dialog).getByLabelText("Evidence note"),
      "Confirmation archived in applications log",
    );
    await user.click(within(dialog).getByRole("button", { name: "Confirm & Complete Task" }));

    expect(onConfirmComplete).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ evidenceNote: "Confirmation archived in applications log" }),
    );
  });

  it("accepts an HTTPS link alone as sufficient evidence", async () => {
    const user = userEvent.setup();
    const onConfirmComplete = vi.fn();
    renderGate(gateTask("w06-sat"), onConfirmComplete);

    const dialog = await checkAllCriteria(user);
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

  it("keeps evidence optional for unflagged tasks", async () => {
    const user = userEvent.setup();
    const onConfirmComplete = vi.fn();
    renderGate(gateTask("w02-mon"), onConfirmComplete);

    const dialog = await checkAllCriteria(user);
    expect(within(dialog).queryByText("Required deliverables")).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Confirm & Complete Task" }));

    expect(onConfirmComplete).toHaveBeenCalledTimes(1);
  });
});
