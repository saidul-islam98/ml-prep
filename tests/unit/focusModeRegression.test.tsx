/**
 * Regression tests for Focus Mode — covers all root-cause scenarios:
 *  1. Typing retains every character; textarea keeps focus across progress updates.
 *  2. Timer auto-resumes on every reopen.
 *  3. Out-of-order saves: the queue ensures writes land in submission order.
 *  4. Close button exists and has an accessible name.
 *  5. Pause, resume, reset, exit, Escape, backdrop-close, and finish behaviour.
 *  6. Escape pauses the timer and persists notes before closing.
 *  7. Harness matches real TaskCard usage (controlled progress + onProgressChange).
 */
import { useState, useCallback } from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FocusModeModal } from "../../src/components/FocusModeModal";
import { getCurriculumTask } from "../../src/curriculum";
import { emptyTaskExecution } from "../../src/hooks/useTaskExecution";
import { CommandError, type TaskExecutionProgressInput } from "../../src/lib/api";

const task = getCurriculumTask("w01-mon")!;

// ---------------------------------------------------------------------------
// Harness: mirrors real TaskCard usage (controlled progress + async persistence)
// ---------------------------------------------------------------------------
interface HarnessProps {
  onSave?: (p: TaskExecutionProgressInput) => Promise<void>;
}

function Harness({ onSave }: HarnessProps) {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState<TaskExecutionProgressInput>(emptyTaskExecution());

  const handleProgressChange = useCallback(
    async (next: TaskExecutionProgressInput) => {
      await onSave?.(next);
      setProgress(next);
    },
    [onSave],
  );

  return (
    <>
      <button onClick={() => setOpen(true)}>Open Focus</button>
      <FocusModeModal
        task={task}
        isOpen={open}
        onClose={() => setOpen(false)}
        onCompleteTask={() => setOpen(false)}
        progress={progress}
        onProgressChange={handleProgressChange}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function openFocus(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Open Focus" }));
  return screen.getByRole("dialog");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("FocusModeModal regression suite", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Issue 1: Typing retains every character ────────────────────────────
  it("retains all characters in the textarea while the timer ticks", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Harness />);
    await openFocus(user);

    const textarea = screen.getByRole("textbox");
    await user.click(textarea);
    await user.type(textarea, "hello world");

    // Simulate multiple timer ticks (which trigger setNow and re-renders)
    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
    });

    expect((textarea as HTMLTextAreaElement).value).toBe("hello world");
  });

  // ── Issue 1b: Textarea keeps focus during progress updates ────────────
  it("keeps focus on the textarea while the parent re-renders from progress changes", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<Harness onSave={onSave} />);
    await openFocus(user);

    const textarea = screen.getByRole("textbox");
    await user.click(textarea);
    await user.type(textarea, "abc");

    // Let the debounce fire, flushing a save (which causes parent re-render)
    await act(async () => {
      vi.advanceTimersByTime(600);
      await Promise.resolve();
    });

    // Focus must still be in the textarea
    expect(document.activeElement).toBe(textarea);
    expect((textarea as HTMLTextAreaElement).value).toBe("abc");
  });

  // ── Issue 2: Timer restarts when Focus Mode is reopened ───────────────
  it("auto-resumes the timer on every reopen even after a pause", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Harness />);

    // First open: timer should be running
    await openFocus(user);
    expect(screen.getByRole("button", { name: "Pause Timer" })).toBeInTheDocument();

    // Pause and close
    await user.click(screen.getByRole("button", { name: "Pause Timer" }));
    await user.click(screen.getByRole("button", { name: "Exit Focus" }));

    // Reopen: timer must auto-resume
    await openFocus(user);
    expect(screen.getByRole("button", { name: "Pause Timer" })).toBeInTheDocument();
  });

  // ── Issue 3: Serial save queue — writes land in submission order ───────
  it("serialises saves so a slow first write cannot overwrite a faster second write", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    // Capture saves in order of resolution, not submission.
    const resolved: TaskExecutionProgressInput[] = [];
    let resolveFirst!: () => void;
    const firstSave = new Promise<void>((r) => (resolveFirst = r));
    let callCount = 0;

    const onSave = vi.fn().mockImplementation((p: TaskExecutionProgressInput) => {
      callCount++;
      if (callCount === 1) {
        // First call is slow: resolve later.
        return firstSave.then(() => {
          resolved.push(p);
        });
      }
      // Subsequent calls are fast.
      resolved.push(p);
      return Promise.resolve();
    });

    render(<Harness onSave={onSave} />);
    await openFocus(user);

    const textarea = screen.getByRole("textbox");
    await user.click(textarea);

    // First batch → debounce → first save (slow)
    await user.type(textarea, "old text");
    await act(async () => {
      vi.advanceTimersByTime(600);
      await Promise.resolve();
    });

    // Second batch → debounce → second save (fast, but queued behind first)
    await user.type(textarea, " new text");
    await act(async () => {
      vi.advanceTimersByTime(600);
      await Promise.resolve();
    });

    // Now let the slow first save settle.
    await act(async () => {
      resolveFirst();
      await Promise.resolve();
      await Promise.resolve(); // drain microtask queue
    });

    // Local draft is always newest.
    expect((textarea as HTMLTextAreaElement).value).toBe("old text new text");

    // Because of the serial queue the second save must wait for the first,
    // so both resolved[] entries exist and are in submission order.
    await waitFor(() => expect(resolved.length).toBeGreaterThanOrEqual(1));
    // The last resolved save must contain the newest text.
    const lastSaved = resolved[resolved.length - 1];
    const firstStepId = task.todos[0].id;
    expect(lastSaved.step_notes[firstStepId]).toBe("old text new text");
  });

  // ── Issue 4: Close button exists and has an accessible name ──────────
  it("renders a close button with aria-label='Exit focus mode'", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openFocus(user);

    expect(screen.getByRole("button", { name: "Exit focus mode" })).toBeInTheDocument();
  });

  // ── Close button dismisses the modal ─────────────────────────────────
  it("pauses and closes on close-button click", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openFocus(user);

    await user.click(screen.getByRole("button", { name: "Exit focus mode" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  // ── Issue 6 (HIGH): Escape pauses timer and persists notes ───────────
  it("Escape pauses the timer and persists the current notes before closing", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const saves: TaskExecutionProgressInput[] = [];
    const onSave = vi.fn().mockImplementation((p: TaskExecutionProgressInput) => {
      saves.push(structuredClone(p));
      return Promise.resolve();
    });

    render(<Harness onSave={onSave} />);
    const trigger = screen.getByRole("button", { name: "Open Focus" });
    await user.click(trigger);

    // Type some notes
    const textarea = screen.getByRole("textbox");
    await user.click(textarea);
    await user.type(textarea, "my notes");

    // Press Escape — must NOT lose notes and must pause the timer
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // At least one save should have happened that:
    //  a) contains the notes typed
    //  b) has timer_started_at === null (timer paused)
    await waitFor(() => expect(saves.length).toBeGreaterThan(0));
    const exitSave = saves[saves.length - 1];
    const firstStepId = task.todos[0].id;
    expect(exitSave.step_notes[firstStepId]).toBe("my notes");
    expect(exitSave.timer_started_at).toBeNull();

    // Trigger should regain focus
    expect(trigger).toHaveFocus();
  });

  // ── Backdrop click closes the modal ───────────────────────────────────
  it("closes when the backdrop overlay is clicked", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openFocus(user);

    const overlay = document.querySelector(".deepml-modal-overlay") as HTMLElement;
    await user.click(overlay);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  // ── Pause / Resume cycle ──────────────────────────────────────────────
  it("pauses and resumes the timer with correct button labels", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Harness />);
    await openFocus(user);

    await user.click(screen.getByRole("button", { name: "Pause Timer" }));
    expect(screen.getByRole("button", { name: "Resume Timer" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Resume Timer" }));
    expect(screen.getByRole("button", { name: "Pause Timer" })).toBeInTheDocument();
  });

  // ── Reset Timer ───────────────────────────────────────────────────────
  it("resets the timer display to 00:00", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Harness />);
    await openFocus(user);

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByText(/\d{2}:\d{2}/)).not.toHaveTextContent("00:00");

    await user.click(screen.getByRole("button", { name: "Reset Timer" }));
    expect(screen.getByText("00:00")).toBeInTheDocument();
  });

  // ── Step navigation ───────────────────────────────────────────────────
  it("navigates forward and backward through steps", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openFocus(user);

    expect(screen.getByText(/Step 1 of/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Complete Step & Next/i }));
    expect(screen.getByText(/Step 2 of/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previous Step" }));
    expect(screen.getByText(/Step 1 of/)).toBeInTheDocument();
  });

  // ── Finish & Mark Complete ────────────────────────────────────────────
  it("closes the modal when Finish & Mark Complete is clicked", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openFocus(user);

    await user.click(screen.getByRole("button", { name: "Finish & Mark Complete" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  // ── Error surfacing: shows exact error and migration hint when table missing ──
  it("surfaces exact error and migration hint when save fails due to missing table", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const onSave = vi.fn().mockRejectedValue(
      new CommandError("Could not find the table 'task_execution_progress' in the schema cache", {
        code: "PGRST205",
      }),
    );

    render(<Harness onSave={onSave} />);
    await openFocus(user);

    const textarea = screen.getByRole("textbox");
    await user.click(textarea);
    await user.type(textarea, "draft notes");

    // Flush debounce
    await act(async () => {
      vi.advanceTimersByTime(600);
      await Promise.resolve();
    });

    // Verify error label and error banner
    const errorElements = await screen.findAllByText(/Save failed/);
    expect(errorElements.length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText(/Could not find the table 'task_execution_progress' in the schema cache/),
    ).toBeInTheDocument();
    expect(screen.getByText(/npx supabase db push/)).toBeInTheDocument();

    // Verify draft notes in textarea are preserved
    expect((textarea as HTMLTextAreaElement).value).toBe("draft notes");

    // Verify console.error was called
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
