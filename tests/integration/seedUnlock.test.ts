/**
 * Seed and optional-unlock command tests (todo.md Tasks 4b and 7).
 *
 * Proves:
 *  - no-profile first login bootstraps the profile and seeds exactly once
 *  - simultaneous first logins on two sessions converge to one complete seed
 *  - forced seed failure rolls back everything including template_version
 *  - an incomplete prior seed is repaired idempotently without duplicate
 *    events
 *  - template inventory matches the mapping manifest and the frontend
 *    artifact (stable keys + content digest)
 *  - unlock_post_training rejects missing gates/missing opt-in, performs the
 *    exact 1,200-minute swap atomically, and is irreversible
 */

import { describe, expect, it, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import {
  authenticatedClient,
  ensureUser,
  resetAllUserData,
  withDb,
  USER_A,
  type TestUser,
} from "./helpers/testUsers";
import {
  TEMPLATE_V1,
  taskDate,
  templateContentDigest,
  TEMPLATE_TASK_KEYS,
} from "../../src/template/templateV1";

let user: TestUser;

beforeEach(async () => {
  await resetAllUserData();
  user = await ensureUser(USER_A);
});

async function clientFor() {
  return authenticatedClient(user);
}

async function counts(userId: string) {
  return withDb(async (db) => {
    const res = await db.query<{
      profiles: string;
      weeks: string;
      tasks: string;
      events: string;
      projects: string;
      milestones: string;
      gates: string;
      template_version: number | null;
    }>(
      `select
         (select count(*)::text from public.profiles where user_id = $1) as profiles,
         (select count(*)::text from public.plan_weeks where user_id = $1) as weeks,
         (select count(*)::text from public.tasks where user_id = $1) as tasks,
         (select count(*)::text from public.task_events where user_id = $1) as events,
         (select count(*)::text from public.projects where user_id = $1) as projects,
         (select count(*)::text from public.project_milestones where user_id = $1) as milestones,
         (select count(*)::text from public.readiness_gates where user_id = $1) as gates,
         (select template_version::text from public.profiles where user_id = $1) as template_version`,
      [userId],
    );
    const row = res.rows[0];
    return {
      profiles: Number(row.profiles),
      weeks: Number(row.weeks),
      tasks: Number(row.tasks),
      events: Number(row.events),
      projects: Number(row.projects),
      milestones: Number(row.milestones),
      gates: Number(row.gates),
      template_version: row.template_version === null ? null : Number(row.template_version),
    };
  });
}

describe("seed_plan_v1", () => {
  it("bootstraps an absent profile and seeds the full template once", async () => {
    const client = await clientFor();
    const result = await client.rpc("seed_plan_v1");
    expect(result.error).toBeNull();
    const body = result.data as { status: string; counts: Record<string, number> };
    expect(body.status).toBe("ok");
    expect(body.counts).toEqual({
      weeks: 14,
      tasks: 118,
      new_tasks: 118,
      projects: 3,
      milestones: 15,
      gates: 13,
    });

    const state = await counts(user.id);
    expect(state).toMatchObject({
      profiles: 1,
      weeks: 14,
      tasks: 118,
      events: 118, // one created event per task
      projects: 3,
      milestones: 15,
      gates: 13,
      template_version: 1,
    });

    // Seeded rows are user-visible through RLS.
    const tasks = await client.from("tasks").select("template_task_key, state, revision");
    expect(tasks.data).toHaveLength(118);
    expect(tasks.data?.every((t) => t.state === "not_started" && t.revision === 0)).toBe(true);
  });

  it("is a no-op when the user already has a complete seed", async () => {
    const client = await clientFor();
    await client.rpc("seed_plan_v1");
    const before = await counts(user.id);
    const second = await client.rpc("seed_plan_v1");
    expect((second.data as { status: string }).status).toBe("already_seeded");
    const after = await counts(user.id);
    expect(after).toEqual(before);
  });

  it("converges when two devices seed simultaneously", async () => {
    const client = await clientFor();
    const [first, second] = await Promise.all([
      client.rpc("seed_plan_v1"),
      client.rpc("seed_plan_v1"),
    ]);
    const statuses = [first, second].map(
      (r) => (r.data as { status: string } | null)?.status ?? "error",
    );
    expect(statuses).toContain("ok");
    expect(statuses).toContain("already_seeded");
    const state = await counts(user.id);
    expect(state).toMatchObject({
      weeks: 14,
      tasks: 118,
      projects: 3,
      milestones: 15,
      gates: 13,
      events: 118,
      template_version: 1,
    });
  });

  it("rolls back completely and leaves template_version unwritten when a task insert fails", async () => {
    const client = await clientFor();
    // Fault trigger: fail when the artifact reaches task w07-mon.
    await withDb(async (db) => {
      await db.query(`
        create or replace function public.__test_fail_seed_task()
        returns trigger language plpgsql as $fn$
        begin
          if new.template_task_key = 'w07-mon' then
            raise exception 'injected seed failure';
          end if;
          return new;
        end;
        $fn$;
      `);
      await db.query(
        `create trigger __test_fail_seed_task_before
         before insert on public.tasks
         for each row execute function public.__test_fail_seed_task()`,
      );
    });
    try {
      const result = await client.rpc("seed_plan_v1");
      expect(result.error).not.toBeNull();
      const state = await counts(user.id);
      // Everything rolled back, including the bootstrap profile row: the
      // whole RPC is one transaction. template_version is not written.
      expect(state).toMatchObject({
        profiles: 0,
        weeks: 0,
        tasks: 0,
        events: 0,
        projects: 0,
        milestones: 0,
        gates: 0,
        template_version: null,
      });
    } finally {
      await withDb(async (db) => {
        await db.query("drop trigger if exists __test_fail_seed_task_before on public.tasks");
        await db.query("drop function if exists public.__test_fail_seed_task()");
      });
    }

    // After removing the fault, seeding succeeds.
    const retry = await client.rpc("seed_plan_v1");
    expect((retry.data as { status: string }).status).toBe("ok");
    expect(await counts(user.id)).toMatchObject({ tasks: 118, template_version: 1 });
  });

  it("repairs an incomplete prior seed idempotently without duplicating events", async () => {
    const client = await clientFor();
    await client.rpc("seed_plan_v1");

    // Simulate an incomplete seed: drop a slice of rows and reset the version.
    await withDb(async (db) => {
      await db.query("update public.profiles set template_version = null where user_id = $1", [
        user.id,
      ]);
      await db.query(
        `delete from public.tasks where user_id = $1
           and template_task_key in ('w10-mon','w11-tue','pt-w9-scope')`,
        [user.id],
      );
      await db.query(
        "delete from public.readiness_gates where user_id = $1 and gate_key = 'coding'",
        [user.id],
      );
      await db.query(
        "delete from public.project_milestones where user_id = $1 and title = 'Skeleton'",
        [user.id],
      );
    });

    const repair = await client.rpc("seed_plan_v1");
    expect((repair.data as { status: string }).status).toBe("ok");
    const body = repair.data as { counts: { new_tasks: number } };
    expect(body.counts.new_tasks).toBe(3);

    const state = await counts(user.id);
    expect(state).toMatchObject({
      weeks: 14,
      tasks: 118,
      projects: 3,
      milestones: 15,
      gates: 13,
      events: 118, // 118 original - 3 deleted with cascade + 3 re-created
      template_version: 1,
    });

    // The repaired tasks keep the canonical schedule; existing user progress
    // (if any) is untouched - verify one untouched task is still at revision 0.
    const untouched = await client
      .from("tasks")
      .select("revision")
      .eq("template_task_key", "w01-mon");
    expect(untouched.data?.[0].revision).toBe(0);
  });

  it("requires an authenticated user", async () => {
    const { anonClient } = await import("./helpers/testUsers");
    const anon = anonClient();
    const result = await anon.rpc("seed_plan_v1");
    expect(result.error).not.toBeNull();
  });
});

describe("template artifact contract", () => {
  it("database artifact matches the frontend template on stable keys and digest", async () => {
    // Frontend canonical digest.
    const frontendDigest = await templateContentDigest();

    // Database artifact digest + payload.
    const { payload, content_digest: dbDigest } = JSON.parse(
      readFileSync(new URL("../../supabase/templates/plan_v1.json", import.meta.url), "utf8"),
    );
    expect(dbDigest).toBe(frontendDigest);

    const dbKeys = payload.tasks.map((t: { key: string }) => t.key).sort();
    const frontendKeys = [...TEMPLATE_TASK_KEYS].sort();
    expect(dbKeys).toEqual(frontendKeys);

    // Dates in the artifact match the derived frontend dates exactly.
    for (const t of payload.tasks) {
      const frontend = TEMPLATE_V1.tasks.find((x) => x.key === t.key);
      if (!frontend) throw new Error(`key ${t.key} missing from the frontend template`);
      expect(t.date, t.key).toBe(taskDate(frontend));
      expect(t.minutes, t.key).toBe(frontend.minutes);
      expect(t.category, t.key).toBe(frontend.category);
    }
  });

  it("loaded artifact in the database equals the checked-in artifact", async () => {
    await clientFor().then((c) => c.rpc("seed_plan_v1"));
    const checkedIn = JSON.parse(
      readFileSync(new URL("../../supabase/templates/plan_v1.json", import.meta.url), "utf8"),
    );
    const loaded = await withDb(async (db) => {
      const res = await db.query<{ payload: unknown; digest: string }>(
        "select payload, content_digest as digest from private.template_artifacts where version = 1",
      );
      return res.rows[0];
    });
    expect(loaded.digest).toBe(checkedIn.content_digest);
    expect(loaded.payload).toEqual(checkedIn.payload);
  });
});

describe("unlock_post_training", () => {
  async function seedAndCompleteGates(client: Awaited<ReturnType<typeof clientFor>>) {
    await client.rpc("seed_plan_v1");
    // Complete every completion-gate milestone of Projects 1-2 with evidence.
    await withDb(async (db) => {
      await db.query(
        `update public.project_milestones m
         set completed_at = now(), evidence_url = 'https://github.com/example/repo/releases/v0.1'
         from public.projects p
         where (m.project_id, m.user_id) = (p.id, m.user_id)
           and m.user_id = $1
           and p.project_key in ('evalops', 'rollout_lab')
           and m.is_completion_gate`,
        [user.id],
      );
    });
  }

  it("rejects when completion gates are not met", async () => {
    const client = await clientFor();
    await client.rpc("seed_plan_v1");
    const result = await client.rpc("unlock_post_training", { p_opt_in: true });
    expect((result.error as Error).message).toMatch(/gates_not_met/);
    const profile = await client.from("profiles").select("post_training_enabled");
    expect(profile.data?.[0].post_training_enabled).toBe(false);
  });

  it("rejects gates met but opt-in missing", async () => {
    const client = await clientFor();
    await seedAndCompleteGates(client);
    const result = await client.rpc("unlock_post_training", { p_opt_in: false });
    expect((result.error as Error).message).toMatch(/opt_in_required/);
  });

  it("performs the exact 1,200-minute swap atomically and irreversibly", async () => {
    const client = await clientFor();
    await seedAndCompleteGates(client);

    const result = await client.rpc("unlock_post_training", { p_opt_in: true });
    expect(result.error).toBeNull();
    const body = result.data as {
      status: string;
      deactivated_minutes: number;
      activated_minutes: number;
      deactivated_task_keys: string[];
      activated_task_keys: string[];
    };
    expect(body.status).toBe("ok");
    expect(body.deactivated_minutes).toBe(1_200);
    expect(body.activated_minutes).toBe(1_200);
    expect(body.deactivated_task_keys.sort()).toEqual(
      [
        "w09-tue",
        "w09-wed",
        "w10-wed",
        "w10-thu",
        "w13-tue",
        "w13-wed",
        "w09-sun-review",
        "w10-sun-review",
        "w11-sun-review",
        "w12-sun-review",
        "w13-sun-review",
        "w14-sat",
      ].sort(),
    );
    expect(body.activated_task_keys.sort()).toEqual(
      [
        "pt-w9-scope",
        "pt-w9-sft",
        "pt-w10-preference",
        "pt-w10-rewards",
        "pt-w11-ablation-setup",
        "pt-w12-ablation",
        "pt-w13-eval",
        "pt-w13-docs",
        "pt-w14-final",
      ].sort(),
    );

    // Profile flag flipped (one-way); Project 3 active.
    const profile = await client.from("profiles").select("post_training_enabled");
    expect(profile.data?.[0].post_training_enabled).toBe(true);
    const projects = await client.from("projects").select("project_key, state");
    const pt = projects.data?.find((p) => p.project_key === "post_training_lab");
    expect(pt?.state).toBe("active");

    // Deactivated tasks are skipped with automated audit events.
    const events = await client
      .from("task_events")
      .select("event_type, metadata")
      .eq("metadata->>reason", "post_training_swap");
    expect(events.data).toHaveLength(12);
    expect(events.data?.every((e) => e.metadata.automated === true)).toBe(true);

    // Total plan scope is unchanged: 118 tasks exist, deactivated are skipped.
    const skipped = await client.from("tasks").select("id").eq("state", "skipped");
    expect(skipped.data).toHaveLength(12);

    // Irreversibility.
    const again = await client.rpc("unlock_post_training", { p_opt_in: true });
    expect((again.error as Error).message).toMatch(/already_enabled/);
  });

  it("refuses the unlock when a mapped swap task has already been resolved", async () => {
    const client = await clientFor();
    await seedAndCompleteGates(client);
    // Complete w09-tue before unlocking: the full swap can no longer be freed.
    const task = await client
      .from("tasks")
      .select("id, revision")
      .eq("template_task_key", "w09-tue");
    await client.rpc("transition_task", {
      p_task_id: task.data?.[0].id,
      p_expected_revision: task.data?.[0].revision,
      p_transition: "complete",
      p_payload: { actual_minutes: 100 },
    });
    const result = await client.rpc("unlock_post_training", { p_opt_in: true });
    expect((result.error as Error).message).toMatch(/swap_unavailable/);
    const profile = await client.from("profiles").select("post_training_enabled");
    expect(profile.data?.[0].post_training_enabled).toBe(false);
  });
});
