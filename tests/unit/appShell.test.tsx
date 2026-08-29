import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App";
import type { Session } from "@supabase/supabase-js";

// The shell tests isolate navigation behavior from auth: a session is
// always present, and the Supabase client is never constructed.
vi.mock("../../src/auth/useSession", () => ({
  useSession: () => ({
    status: "authenticated",
    session: { user: { id: "test-user" } } as unknown as Session,
  }),
}));

describe("App shell", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the Today view by default with primary navigation landmarks", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Today" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Today" })).toHaveAttribute("aria-current", "page");
  });

  it("navigates to another view through a hash link and back", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: "Plan" }));
    expect(window.location.hash).toBe("#/plan");
    expect(screen.getByRole("heading", { name: "Plan" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Plan" })).toHaveAttribute("aria-current", "page");

    await user.click(screen.getByRole("link", { name: "Today" }));
    expect(window.location.hash).toBe("#/today");
    expect(screen.getByRole("heading", { name: "Today" })).toBeInTheDocument();
  });

  it("renders all seven MVP views as navigation entries", () => {
    render(<App />);
    for (const label of [
      "Today",
      "Plan",
      "Projects",
      "Practice",
      "Readiness",
      "Progress",
      "Settings",
    ]) {
      expect(screen.getAllByRole("link", { name: label }).length).toBeGreaterThan(0);
    }
  });
});
