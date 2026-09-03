import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TaskDetailModal } from "../../src/components/TaskDetailModal";
import { FocusModeModal } from "../../src/components/FocusModeModal";
import { CompletionGateModal } from "../../src/components/CompletionGateModal";
import { WeekSummaryBanner } from "../../src/components/WeekSummaryBanner";
import { getCurriculumTask, getCurriculumWeek } from "../../src/curriculum";

describe("Task Execution and Progressive Disclosure UI", () => {
  const task = getCurriculumTask("w01-mon")!;
  const week1 = getCurriculumWeek(1)!;

  it("renders TaskDetailModal with execution tabs, objective, and action checklist", () => {
    const handleClose = vi.fn();
    const handleFocus = vi.fn();
    const handleComplete = vi.fn();

    render(
      <TaskDetailModal
        task={task}
        isOpen={true}
        onClose={handleClose}
        onStartFocus={handleFocus}
        onComplete={handleComplete}
      />,
    );

    expect(screen.getByText("Timed Python coding baseline and mistake log")).toBeInTheDocument();
    expect(
      screen.getByText(/Establish an honest baseline of interview coding speed/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Atomic Action Steps/)).toBeInTheDocument();

    // Check tabs
    const resourceTab = screen.getByRole("tab", { name: /Targeted Resources/i });
    fireEvent.click(resourceTab);
    expect(
      screen.getByText(/Longest Substring Without Repeating Characters \(LeetCode medium/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Max Area of Island \(LeetCode medium/)).toBeInTheDocument();
    expect(screen.getAllByText(/Timed attempt \(40 minutes max\)/)).toHaveLength(2);

    // Switch to Definition of Done tab
    const criteriaTab = screen.getByRole("tab", { name: /Definition of Done/i });
    fireEvent.click(criteriaTab);
    expect(
      screen.getByText(/2 timed medium problems attempted under 40 min each/),
    ).toBeInTheDocument();

    // Launch focus mode
    const launchFocusBtn = screen.getAllByRole("button", { name: /Launch Focus Mode/i })[0];
    fireEvent.click(launchFocusBtn);
    expect(handleFocus).toHaveBeenCalledWith(task);
  });

  it("renders FocusModeModal with step progress and step timer", () => {
    const handleClose = vi.fn();
    const handleComplete = vi.fn();

    render(
      <FocusModeModal
        task={task}
        isOpen={true}
        onClose={handleClose}
        onCompleteTask={handleComplete}
      />,
    );

    expect(screen.getByText("Focus Execution")).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 7")).toBeInTheDocument();
    expect(screen.getByText(/Setup: Open blank editor/)).toBeInTheDocument();

    // Next step navigation
    const nextBtn = screen.getByRole("button", { name: /Complete Step & Next/i });
    fireEvent.click(nextBtn);
    expect(screen.getByText("Step 2 of 7")).toBeInTheDocument();
  });

  it("enforces CompletionGateModal validation and override rationale", () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <CompletionGateModal
        task={task}
        isOpen={true}
        onClose={handleClose}
        onConfirmComplete={handleConfirm}
      />,
    );

    expect(screen.getByText("Verify Definition of Done")).toBeInTheDocument();
    expect(screen.getByText(/Some required criteria are not checked/)).toBeInTheDocument();

    // Fill in override rationale
    const textarea = screen.getByPlaceholderText(/Required override rationale/i);
    fireEvent.change(textarea, { target: { value: "Completed on LeetCode with test cases" } });

    const completeBtn = screen.getByRole("button", { name: /Override & Complete Task/i });
    fireEvent.click(completeBtn);
    expect(handleConfirm).toHaveBeenCalledWith(
      task,
      expect.objectContaining({
        actualMinutes: 120,
        overrideReason: "Completed on LeetCode with test cases",
        completedCriterionIds: [],
      }),
    );
  });

  it("renders WeekSummaryBanner with objectives, outcomes, and exit checks", () => {
    render(<WeekSummaryBanner week={week1} />);

    expect(screen.getByText("Positioning and baselines")).toBeInTheDocument();
    expect(screen.getByText(/Execute the canonical Week 1 routine/)).toBeInTheDocument();

    // Toggle details
    const toggleBtn = screen.getByRole("button", { name: /View Outcomes & Exit Check/i });
    fireEvent.click(toggleBtn);

    expect(screen.getByText(/8 scheduled sessions completed/)).toBeInTheDocument();
    expect(screen.getAllByText(/Data\/Eval application submitted/)).toHaveLength(2);
  });
});
