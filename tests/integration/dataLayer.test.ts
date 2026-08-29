/**
 * Data-layer integration tests (todo.md Task 8/9 backend contract): two
 * sessions share state through the same PrepApi path the UI uses, and the
 * overdue/reschedule/skip semantics behave per spec section 8.1.
 */

import { describe, expect, it, beforeEach } from "vitest";
import { createPrepApi, CommandError, type PrepApi } from "../../src/lib/api";
import { authenticatedClient, ensureUser, resetAllUserData, USER_A } from "./helpers/testUsers";

let user: Awaited<ReturnType<typeof ensureUser>>;
let apiA: PrepApi;

beforeEach(async () => {
  await resetAllUserData();
  user = await ensureUser(USER_A);
  const client = await authenticatedClient(user);
  apiA = createPrepApi(client);
  await apiA.seedPlan();
});

describe("cross-session synchronization", () => {
  it("a completion made in one session is visible in a second session", async () => {
    const tasksA = await apiA.fetchTasks();
    const target = tasksA.find((t) => t.template_task_key === "w01-mon");
    expect(target).toBeDefined();

    const result = await apiA.transition(target!.id, target!.revision, "complete", {
      actual_minutes: 105,
      evidence_url: "https://github.com/example/commit/abc123",
    });
    expect(result.outcome).toBe("ok");

    // Fresh "second device" session.
    const clientB = await authenticatedClient(user);
    const apiB = createPrepApi(clientB);
    const tasksB = await apiB.fetchTasks();
    const seen = tasksB.find((t) => t.template_task_key === "w01-mon");
    expect(seen?.state).toBe("completed");
    expect(seen?.actual_minutes).toBe(105);
    expect(seen?.evidence_url).toBe("https://github.com/example/commit/abc123");
  });

  it("conflict surfaces the latest row and a retry with the new revision succeeds", async () => {
    const tasks = await apiA.fetchTasks();
    const target = tasks.find((t) => t.template_task_key === "w02-wed")!;

    // Session B moves the task forward first.
    const clientB = await authenticatedClient(user);
    const apiB = createPrepApi(clientB);
    await apiB.transition(target.id, target.revision, "start");

    // Session A still holds the stale revision.
    const stale = await apiA.transition(target.id, target.revision, "complete", {
      actual_minutes: 60,
    });
    expect(stale.outcome).toBe("conflict");
    if (stale.outcome === "conflict") {
      expect(stale.task.revision).toBe(target.revision + 1);
      expect(stale.task.state).toBe("in_progress");
    }

    // Explicit retry with the latest revision.
    const retry = await apiA.transition(target.id, target.revision + 1, "complete", {
      actual_minutes: 60,
    });
    expect(retry.outcome).toBe("ok");
  });
});

describe("overdue and schedule semantics through the API", () => {
  it("reschedule records history and preserves the original cohort date", async () => {
    const tasks = await apiA.fetchTasks();
    const target = tasks.find((t) => t.template_task_key === "w01-mon")!;
    const today = new Date().toISOString().slice(0, 10);

    const result = await apiA.transition(target.id, target.revision, "reschedule", {
      to_date: today,
      reason: "collision with travel",
    });
    expect(result.outcome).toBe("ok");
    expect(result.task.scheduled_date).toBe(today);
    expect(result.task.original_scheduled_date).toBe("2026-08-31");

    const events = await apiA.fetchTaskEvents(target.id);
    const reschedule = events.find((e) => e.event_type === "rescheduled");
    expect(reschedule?.from_scheduled_date).toBe("2026-08-31");
    expect(reschedule?.to_scheduled_date).toBe(today);
    expect(reschedule?.metadata.reason).toBe("collision with travel");
  });

  it("skip requires a reason (server enforced)", async () => {
    const tasks = await apiA.fetchTasks();
    const target = tasks.find((t) => t.template_task_key === "w01-tue")!;
    await expect(apiA.transition(target.id, target.revision, "skip", {})).rejects.toMatchObject({
      kind: "invalid_payload",
    });
  });

  it("skip with a reason records the reason and removes completion credit eligibility", async () => {
    const tasks = await apiA.fetchTasks();
    const target = tasks.find((t) => t.template_task_key === "w01-tue")!;
    const result = await apiA.transition(target.id, target.revision, "skip", {
      reason: "Covered by work workshop",
    });
    expect(result.task.state).toBe("skipped");
    expect(result.task.skip_reason).toBe("Covered by work workshop");

    const reopened = await apiA.transition(result.task.id, result.task.revision, "reopen");
    expect(reopened.task.state).toBe("not_started");
    expect(reopened.task.skip_reason).toBeNull();
  });
});

describe("custom tasks through the API", () => {
  it("creates, edits, and archives a custom task with history", async () => {
    const created = await apiA.createCustomTask({
      title: "Prepare recruiter questions",
      category: "application",
      scheduled_date: "2026-09-07",
      estimated_minutes: 45,
    });
    expect(created.template_task_key).toBeNull();
    expect(created.revision).toBe(0);

    const edited = await apiA.transition(created.id, 0, "edit", {
      title: "Prepare recruiter questions (final)",
      estimated_minutes: 60,
    });
    expect(edited.task.title).toBe("Prepare recruiter questions (final)");
    expect(edited.task.revision).toBe(1);

    const archived = await apiA.transition(edited.task.id, 1, "archive", {
      reason: "superseded by mock prep",
    });
    expect(archived.task.state).toBe("archived");

    const events = await apiA.fetchTaskEvents(created.id);
    expect(events.map((e) => e.event_type)).toEqual(["created", "edited", "archived"]);
  });

  it("template tasks cannot be archived", async () => {
    const tasks = await apiA.fetchTasks();
    const template = tasks.find((t) => t.template_task_key === "w01-wed")!;
    await expect(
      apiA.transition(template.id, template.revision, "archive", { reason: "nope" }),
    ).rejects.toMatchObject({ kind: "invalid_transition" });
  });
});

describe("profile and seeding via the API", () => {
  it("reports the seeded profile", async () => {
    const profile = await apiA.fetchProfile();
    expect(profile?.template_version).toBe(1);
    expect(profile?.timezone).toBe("America/Toronto");
    expect(profile?.post_training_enabled).toBe(false);
  });

  it("seeding twice is a no-op", async () => {
    const again = await apiA.seedPlan();
    expect(again.status).toBe("already_seeded");
  });

  it("unauthenticated API access is rejected", async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const { getLocalSupabaseEnv } = await import("./helpers/localSupabase");
    const env = getLocalSupabaseEnv();
    const anon = createClient(env.apiUrl, env.publishableKey, {
      auth: { persistSession: false },
    });
    const anonApi = createPrepApi(anon);
    await expect(anonApi.fetchTasks()).rejects.toBeInstanceOf(CommandError);
  });
});

describe("practice sessions and correction tasks", () => {
  it("creates a session, records an outcome, and links a correction task owner-safely", async () => {
    const created = await apiA.createPracticeSession({
      session_type: "coding",
      date: "2026-08-31",
      topic: "Two-pointer drills",
      allotted_minutes: 90,
    });
    expect(created.state).toBe("planned");

    await apiA.updatePracticeSession(created.id, {
      state: "completed",
      completed_at: new Date().toISOString(),
      elapsed_minutes: 80,
      result: "solved",
      mistake_category: "reasoning",
      correction_due_date: "2026-09-05",
    });

    const correction = await apiA.createCorrectionTask({
      title: "Correction: Two-pointer drills",
      scheduled_date: "2026-09-05",
      estimated_minutes: 45,
      source_practice_session_id: created.id,
    });
    expect(correction.source_practice_session_id).toBe(created.id);
    expect(correction.category).toBe("practice");

    const events = await apiA.fetchTaskEvents(correction.id);
    expect(events[0].metadata.source_practice_session_id).toBe(created.id);

    // A second user cannot attach a correction task to user A's session.
    const clientB = await authenticatedClient(
      await ensureUser({ email: "test-user-b@ml-prep.local", password: "integration-b-passw0rd" }),
    );
    const apiB = createPrepApi(clientB);
    await expect(
      apiB.createCorrectionTask({
        title: "Smuggled correction",
        scheduled_date: "2026-09-05",
        estimated_minutes: 30,
        source_practice_session_id: created.id,
      }),
    ).rejects.toBeInstanceOf(CommandError);
  });

  it("persists normalized mock scores per dimension", async () => {
    const mock = await apiA.createPracticeSession({
      session_type: "mock",
      date: "2026-08-31",
      topic: "ML system design",
      allotted_minutes: 60,
    });
    await apiA.updatePracticeSession(mock.id, {
      state: "completed",
      completed_at: new Date().toISOString(),
      result: "completed",
    });
    await apiA.saveMockScore(mock.id, "problem_framing", 4);
    await apiA.saveMockScore(mock.id, "integrity", 5);
    await apiA.saveMockScore(mock.id, "problem_framing", 3); // upsert overwrites

    const scores = await apiA.fetchMockScores();
    const framing = scores.filter(
      (s) => s.practice_session_id === mock.id && s.dimension_key === "problem_framing",
    );
    expect(framing).toHaveLength(1);
    expect(framing[0].score).toBe(3);
    expect(scores.filter((s) => s.practice_session_id === mock.id)).toHaveLength(2);
  });
});

describe("data export", () => {
  it("includes every owned row and never includes credentials", async () => {
    await apiA.seedPlan();
    const exportData = await apiA.exportAllData();

    const expectedTables = [
      "profiles",
      "plan_weeks",
      "tasks",
      "task_events",
      "projects",
      "project_milestones",
      "practice_sessions",
      "mock_scores",
      "readiness_gates",
      "daily_checkins",
    ];
    for (const table of expectedTables) {
      expect(Array.isArray(exportData[table]), table).toBe(true);
    }
    expect((exportData.tasks as unknown[]).length).toBe(118);
    expect((exportData.plan_weeks as unknown[]).length).toBe(14);

    const serialized = JSON.stringify(exportData);
    // The export path runs with the publishable key only; assert no
    // privileged secret classes appear.
    expect(serialized).not.toContain("sb_secret_");
    expect(serialized).not.toContain("service_role");
    expect(serialized).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("does not expose another user's rows through the export", async () => {
    await apiA.seedPlan();
    const exportData = (await apiA.exportAllData()) as Record<string, { user_id: string }[]>;
    for (const table of ["tasks", "profiles", "projects"]) {
      for (const row of exportData[table]) {
        expect(row.user_id).toBe(user.id);
      }
    }
  });
});
