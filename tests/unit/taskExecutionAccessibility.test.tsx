import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompletionGateModal } from "../../src/components/CompletionGateModal";
import { getCurriculumTask } from "../../src/curriculum";

const task = getCurriculumTask("w01-mon")!;

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open completion gate</button>
      <CompletionGateModal
        task={task}
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirmComplete={vi.fn()}
      />
    </>
  );
}

describe("task execution dialog accessibility", () => {
  it("moves focus into the dialog, traps Tab, closes on Escape, and restores trigger focus", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const trigger = screen.getByRole("button", { name: "Open completion gate" });
    await user.click(trigger);
    const close = screen.getByRole("button", { name: "Close gate dialog" });
    expect(close).toHaveFocus();

    const last = screen.getByRole("button", { name: "Override & Complete Task" });
    last.focus();
    await user.tab();
    expect(close).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
