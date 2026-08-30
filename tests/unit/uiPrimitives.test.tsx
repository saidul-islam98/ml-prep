/**
 * UI primitive tests (Task UI-2): rendering, variants, menu keyboard and
 * outside-close behavior, progress accessibility, and disclosure toggling.
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Badge,
  Button,
  Disclosure,
  EmptyState,
  Menu,
  PageHeader,
  ProgressBar,
  SkeletonRows,
} from "../../src/components/ui";

describe("Button", () => {
  it("renders variants and honors disabled state", () => {
    render(
      <>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button disabled>Disabled</Button>
      </>,
    );
    expect(screen.getByRole("button", { name: "Primary" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Disabled" })).toBeDisabled();
  });

  it("fires clicks when enabled and not when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <>
        <Button onClick={onClick}>Go</Button>
        <Button disabled onClick={onClick}>
          No
        </Button>
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Go" }));
    await user.click(screen.getByRole("button", { name: "No" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("Badge and EmptyState", () => {
  it("applies tone classes", () => {
    render(<Badge tone="success">ok</Badge>);
    expect(screen.getByText("ok").className).toContain("ui-badge--success");
  });

  it("renders empty state with title, body, and action", () => {
    render(
      <EmptyState title="Nothing here" action={<button type="button">Do it</button>}>
        Some explanation
      </EmptyState>,
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByText("Some explanation")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Do it" })).toBeInTheDocument();
  });
});

describe("ProgressBar", () => {
  it("exposes value bounds and label to assistive tech", () => {
    render(<ProgressBar value={30} max={120} label="Planned minutes" />);
    const bar = screen.getByRole("progressbar", { name: "Planned minutes" });
    expect(bar).toHaveAttribute("aria-valuenow", "30");
    expect(bar).toHaveAttribute("aria-valuemax", "120");
  });

  it("clamps percentage when value exceeds max", () => {
    render(<ProgressBar value={500} max={120} label="over" />);
    const fill = document.querySelector(".ui-progress__fill") as HTMLElement;
    expect(fill.style.width).toBe("100%");
  });

  it("renders zero-width bar for zero denominator", () => {
    render(<ProgressBar value={0} max={0} label="empty" />);
    const fill = document.querySelector(".ui-progress__fill") as HTMLElement;
    expect(fill.style.width).toBe("0%");
  });
});

describe("Menu", () => {
  it("opens on trigger, runs the selected item, and closes", async () => {
    const user = userEvent.setup();
    const first = vi.fn();
    const second = vi.fn();
    render(
      <Menu
        triggerLabel="More actions"
        items={[
          { label: "Reschedule", onSelect: first },
          { label: "Skip", onSelect: second },
        ]}
      />,
    );

    const trigger = screen.getByRole("button", { name: "More actions" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const menu = screen.getByRole("menu", { name: "More actions" });

    await user.click(within(menu).getByRole("menuitem", { name: "Skip" }));
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
    // Focus returns to the trigger after closing.
    expect(trigger).toHaveFocus();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Menu triggerLabel="Actions" items={[{ label: "Only", onSelect: vi.fn() }]} />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Actions" })).toHaveFocus();
  });

  it("closes on outside click without selecting anything", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <>
        <Menu triggerLabel="Actions" items={[{ label: "Only", onSelect }]} />
        <button type="button">outside</button>
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "outside" }));
    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("disables individual items", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Menu triggerLabel="Actions" items={[{ label: "Locked", onSelect, disabled: true }]} />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    const item = screen.getByRole("menuitem", { name: "Locked" });
    expect(item).toBeDisabled();
    await user.click(item);
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe("Disclosure, PageHeader, SkeletonRows", () => {
  it("toggles disclosure content and announces expanded state", async () => {
    const user = userEvent.setup();
    render(
      <Disclosure label="Show history">
        <p>event one</p>
      </Disclosure>,
    );
    const toggle = screen.getByRole("button", { name: "Show history" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(screen.getByText("event one")).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("renders page header with description and actions", () => {
    render(
      <PageHeader title="Today" description="the plan for now">
        <Badge tone="accent">Week 1</Badge>
      </PageHeader>,
    );
    expect(screen.getByRole("heading", { name: "Today" })).toBeInTheDocument();
    expect(screen.getByText("the plan for now")).toBeInTheDocument();
    expect(screen.getByText("Week 1")).toBeInTheDocument();
  });

  it("renders skeleton rows with a status label", () => {
    render(<SkeletonRows rows={2} label="Loading tasks" />);
    expect(screen.getByRole("status", { name: "Loading tasks" })).toBeInTheDocument();
  });
});
