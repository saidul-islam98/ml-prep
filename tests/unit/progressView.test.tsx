import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PrepApi } from "../../src/lib/api";
import { ProgressView } from "../../src/views/ProgressView";

const api = vi.hoisted(() => ({ current: null as unknown as PrepApi }));
vi.mock("../../src/hooks/useApi", () => ({ useApi: () => api.current }));
vi.mock("../../src/hooks/useProfile", () => ({
  useProfile: () => ({ data: { post_training_enabled: false } }),
}));
vi.mock("../../src/hooks/useTasks", () => ({ useTasks: () => ({ data: [] }) }));

function renderView() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ProgressView />
    </QueryClientProvider>,
  );
}

describe("ProgressView", () => {
  it("compares the current and previous week and exposes an accessible trend summary", async () => {
    api.current = {
      fetchPlanWeeks: vi.fn().mockResolvedValue([]),
      fetchAllTaskEvents: vi.fn().mockResolvedValue([]),
      fetchProjects: vi.fn().mockResolvedValue([]),
      fetchMilestones: vi.fn().mockResolvedValue([]),
      fetchPracticeSessions: vi.fn().mockResolvedValue([]),
      fetchMockScores: vi.fn().mockResolvedValue([]),
      fetchReadinessGates: vi.fn().mockResolvedValue([]),
    } as unknown as PrepApi;
    renderView();

    expect(await screen.findByText("Current 7 days")).toBeInTheDocument();
    expect(screen.getByText("Previous 7 days")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Weekly resolution trend" })).toBeInTheDocument();
  });
});
