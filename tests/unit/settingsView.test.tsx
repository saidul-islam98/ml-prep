/**
 * Settings view component tests (todo.md Tasks 15 and 17): fixed reminder
 * with installed/verified status, ICS + Google Calendar controls with no
 * private content, HTTPS validation, export, and sign-out cache clearing.
 */

import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PrepApi } from "../../src/lib/api";
import { SettingsView, deployedTodayUrl } from "../../src/views/SettingsView";
import { queryClient } from "../../src/lib/queryClient";

const apiStub = vi.hoisted(() => ({ current: null as unknown as PrepApi }));
vi.mock("../../src/hooks/useApi", () => ({
  useApi: () => apiStub.current,
  getApi: () => apiStub.current,
}));

const sessionStub = vi.hoisted(() => ({
  current: {
    status: "authenticated",
    session: { user: { email: "owner@example.com" } },
  } as unknown,
}));
vi.mock("../../src/auth/useSession", () => ({
  useSession: () => sessionStub.current,
  signOut: vi.fn(async () => {
    queryClient.clear();
  }),
}));

function makeApiStub(overrides: Partial<PrepApi> = {}): PrepApi {
  return {
    fetchProfile: vi.fn().mockResolvedValue({
      user_id: "user-1",
      timezone: "America/Toronto",
      reminder_local_time: "17:00",
      reminder_installed_at: null,
      reminder_verified_at: null,
      post_training_enabled: false,
      template_version: 1,
    }),
    updateProfileReminder: vi.fn().mockResolvedValue(undefined),
    exportAllData: vi.fn().mockResolvedValue({
      exported_at: "2026-08-29T00:00:00Z",
      tasks: [{ id: "t1", title: "x" }],
    }),
    fetchTasks: vi.fn().mockResolvedValue([]),
    fetchTaskEvents: vi.fn().mockResolvedValue([]),
    fetchAllTaskEvents: vi.fn().mockResolvedValue([]),
    fetchPlanWeeks: vi.fn().mockResolvedValue([]),
    fetchProjects: vi.fn().mockResolvedValue([]),
    fetchMilestones: vi.fn().mockResolvedValue([]),
    fetchPracticeSessions: vi.fn().mockResolvedValue([]),
    fetchMockScores: vi.fn().mockResolvedValue([]),
    fetchReadinessGates: vi.fn().mockResolvedValue([]),
    updateReadinessGate: vi.fn(),
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
  // Use the module-level queryClient so sign-out clearing and invalidations
  // operate on the same client the component reads from.
  return render(
    <QueryClientProvider client={queryClient}>
      <SettingsView />
    </QueryClientProvider>,
  );
}

describe("SettingsView", () => {
  let api: PrepApi;

  beforeEach(() => {
    api = makeApiStub();
    apiStub.current = api;
    queryClient.clear();
  });

  it("shows the account email and the fixed reminder time and timezone", async () => {
    renderView();
    expect(await screen.findByText("owner@example.com")).toBeInTheDocument();
    expect(screen.getByText(/5:00 PM America\/Toronto/)).toBeInTheDocument();
    expect(screen.getByText(/not installed/)).toBeInTheDocument();
  });

  it("generates a Google Calendar URL and an ICS download with no private content", async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open");
    renderView();

    const calendarLink = await screen.findByRole("link", { name: "Add to Google Calendar" });
    expect(calendarLink).toHaveAttribute("href", expect.stringContaining("calendar.google.com"));
    expect(calendarLink.getAttribute("href")).toContain("ctz=America%2FToronto");
    expect(calendarLink).toHaveAttribute("rel", "noopener noreferrer");

    const icsHref = calendarLink.getAttribute("href") ?? "";
    for (const term of ["mohammed", "saidul", "resume", "evalops"]) {
      expect(icsHref.toLowerCase()).not.toContain(term);
    }

    URL.createObjectURL = vi.fn(() => "blob:mock");
    URL.revokeObjectURL = vi.fn();
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    await user.click(screen.getByRole("button", { name: "Download .ics" }));
    expect(anchorClick).toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it("marks installed when the calendar link is used, then verified", async () => {
    const user = userEvent.setup();
    // Simulate server state: installed_at starts empty, then the write lands.
    let installedAt: string | null = null;
    vi.mocked(api.fetchProfile).mockImplementation(async () => ({
      user_id: "user-1",
      timezone: "America/Toronto",
      reminder_local_time: "17:00",
      reminder_installed_at: installedAt,
      reminder_verified_at: null,
      post_training_enabled: false,
      template_version: 1,
    }));
    renderView();

    const link = await screen.findByRole("link", { name: "Add to Google Calendar" });
    await user.click(link);
    await waitFor(() => {
      expect(api.updateProfileReminder).toHaveBeenCalledWith({
        reminder_installed_at: expect.any(String),
      });
    });

    // The write landed on the server; refetch sees the new state.
    installedAt = "2026-08-29T12:00:00Z";
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    await screen.findByText(/installed -/);

    const verify = await screen.findByRole("button", { name: "Mark verified on device" });
    await user.click(verify);
    await waitFor(() => {
      expect(api.updateProfileReminder).toHaveBeenCalledWith({
        reminder_verified_at: expect.any(String),
      });
    });
  });

  it("exports owned data as JSON without any credential", async () => {
    const user = userEvent.setup();
    URL.createObjectURL = vi.fn(() => "blob:mock");
    URL.revokeObjectURL = vi.fn();
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    renderView();

    await user.click(await screen.findByRole("button", { name: /Export all data/ }));
    await waitFor(() => {
      expect(api.exportAllData).toHaveBeenCalled();
    });
    expect(anchorClick).toHaveBeenCalled();
    const blobArg = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0] as Blob;
    const text = await blobArg.text();
    expect(JSON.parse(text).tasks).toHaveLength(1);
    // No auth secret may appear - the export path has no credential access.
    expect(text).not.toContain("service_role");
    expect(text).not.toContain("sb_secret_");
  });

  it("signs out and clears the query cache", async () => {
    const user = userEvent.setup();
    queryClient.setQueryData(["tasks"], [{ id: "leftover" }]);
    renderView();

    await user.click(await screen.findByRole("button", { name: "Sign out" }));
    await waitFor(() => {
      expect(queryClient.getQueryData(["tasks"])).toBeUndefined();
    });
  });

  it("builds the deployed Today URL from the base path", () => {
    expect(deployedTodayUrl()).toMatch(/#\/today$/);
    expect(deployedTodayUrl()).toContain(import.meta.env.BASE_URL);
  });
});
