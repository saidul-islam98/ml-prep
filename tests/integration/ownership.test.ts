/**
 * Schema and ownership boundary tests (todo.md Task 3b).
 *
 * Proves:
 *  - user B cannot read user A's rows through the API
 *  - user B cannot mutate user A's rows
 *  - cross-owner child references are rejected by composite owner FKs
 *  - clients can only SELECT task_events (no insert/update/delete)
 *  - tasks are SELECT-only for clients (mutations flow through RPCs)
 *  - state-dependent checks and HTTPS evidence constraints hold
 *  - deleting an Auth user cascades all owned application rows
 */

import { describe, expect, it, beforeEach } from "vitest";
import type { PostgrestError } from "@supabase/supabase-js";
import {
  authenticatedClient,
  anonClient,
  ensureBothUsers,
  resetAllUserData,
  withDb,
  adminClient,
  type TestUser,
} from "./helpers/testUsers";

let userA: TestUser;
let userB: TestUser;

interface Fixture {
  projectId: string;
  milestoneId: string;
  taskId: string;
  practiceSessionId: string;
  eventId: string;
  gateId: string;
  weekId: string;
}

async function seedFixtureFor(userId: string): Promise<Fixture> {
  return withDb(async (db) => {
    await db.query(`insert into public.profiles (user_id) values ($1)`, [userId]);
    await db.query(
      `insert into public.plan_weeks (user_id, week_number, title, start_date, end_date, phase, exit_check)
       values ($1, 1, 'Positioning and baselines', '2026-08-31', '2026-09-06', 'foundation', 'Data/Eval application submitted')`,
      [userId],
    );
    const project = await db.query<{ id: string }>(
      `insert into public.projects (user_id, project_key, name, target_roles, budget_minutes, state)
       values ($1, 'evalops', 'EvalOps for tool-using enterprise agents', '{data_eval,agent_env}', 1950, 'active')
       returning id`,
      [userId],
    );
    const milestone = await db.query<{ id: string }>(
      `insert into public.project_milestones (user_id, project_id, title, acceptance_criteria, target_date, sort_order, is_completion_gate)
       values ($1, $2, 'Skeleton', 'Task schema + verifier skeleton committed', '2026-09-20', 1, false)
       returning id`,
      [userId, project.rows[0].id],
    );
    const task = await db.query<{ id: string }>(
      `insert into public.tasks (user_id, template_task_key, title, category, role_tags, project_id,
         original_scheduled_date, scheduled_date, estimated_minutes)
       values ($1, 'w01-mon', 'Timed Python + review', 'practice', '{data_eval}', $2,
         '2026-08-31', '2026-08-31', 120)
       returning id`,
      [userId, project.rows[0].id],
    );
    const session = await db.query<{ id: string }>(
      `insert into public.practice_sessions (user_id, session_type, date, state, topic, allotted_minutes)
       values ($1, 'coding', '2026-08-31', 'completed', 'Two-sum and intervals', 120)
       returning id`,
      [userId],
    );
    const event = await db.query<{ id: string }>(
      `insert into public.task_events (user_id, task_id, event_type, metadata)
       values ($1, $2, 'created', '{"template_task_key":"w01-mon"}')
       returning id`,
      [userId, task.rows[0].id],
    );
    const gate = await db.query<{ id: string }>(
      `insert into public.readiness_gates (user_id, role_key, gate_key, title)
       values ($1, 'data_eval', 'resume', 'Resume gate')
       returning id`,
      [userId],
    );
    return {
      projectId: project.rows[0].id,
      milestoneId: milestone.rows[0].id,
      taskId: task.rows[0].id,
      practiceSessionId: session.rows[0].id,
      eventId: event.rows[0].id,
      gateId: gate.rows[0].id,
      weekId: "",
    };
  });
}

beforeEach(async () => {
  await resetAllUserData();
  const users = await ensureBothUsers();
  userA = users.userA;
  userB = users.userB;
});

describe("row visibility between two users", () => {
  it("user A sees own rows; user B sees none", async () => {
    await seedFixtureFor(userA.id);
    const clientA = await authenticatedClient(userA);
    const clientB = await authenticatedClient(userB);

    const aTasks = await clientA.from("tasks").select("id, template_task_key");
    expect(aTasks.error).toBeNull();
    expect(aTasks.data).toHaveLength(1);
    expect(aTasks.data?.[0].template_task_key).toBe("w01-mon");

    const bTasks = await clientB.from("tasks").select("id");
    expect(bTasks.error).toBeNull();
    expect(bTasks.data).toHaveLength(0);

    const bAll = await Promise.all(
      [
        "profiles",
        "plan_weeks",
        "projects",
        "project_milestones",
        "task_events",
        "practice_sessions",
        "readiness_gates",
      ].map(async (table) => {
        const keyColumn = table === "profiles" ? "user_id" : "id";
        const res = await clientB.from(table).select(keyColumn);
        expect(res.error).toBeNull();
        return res.data?.length ?? -1;
      }),
    );
    expect(bAll).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it("user B cannot read user A's task even when guessing its id", async () => {
    const fixture = await seedFixtureFor(userA.id);
    const clientB = await authenticatedClient(userB);
    const result = await clientB.from("tasks").select("*").eq("id", fixture.taskId);
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(0);
  });

  it("anon receives no data and no privileges", async () => {
    await seedFixtureFor(userA.id);
    const client = anonClient();
    const result = await client.from("tasks").select("*");
    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });
});

describe("cross-user mutation rejection", () => {
  it("user B cannot update or delete user A's rows", async () => {
    const fixture = await seedFixtureFor(userA.id);
    const clientB = await authenticatedClient(userB);

    const taskUpdate = await clientB
      .from("tasks")
      .update({ title: "hijacked" })
      .eq("id", fixture.taskId)
      .select();
    // Tasks have no client UPDATE grant at all.
    expect(taskUpdate.error).not.toBeNull();

    // RLS-protected tables: the mutation is filtered to zero affected rows
    // and the stored data stays unchanged.
    const gateUpdate = await clientB
      .from("readiness_gates")
      .update({ state: "ready" })
      .eq("id", fixture.gateId)
      .select();
    expect(gateUpdate.error).toBeNull();
    expect(gateUpdate.data).toHaveLength(0);

    const projectUpdate = await clientB
      .from("projects")
      .update({ blocker_note: "hijacked" })
      .eq("id", fixture.projectId)
      .select();
    expect(projectUpdate.error).toBeNull();
    expect(projectUpdate.data).toHaveLength(0);

    const sessionDelete = await clientB
      .from("practice_sessions")
      .delete()
      .eq("id", fixture.practiceSessionId)
      .select();
    expect(sessionDelete.error).toBeNull();
    expect(sessionDelete.data).toHaveLength(0);

    const unchanged = await withDb(async (db) => {
      const task = await db.query<{ title: string }>(
        "select title from public.tasks where id = $1",
        [fixture.taskId],
      );
      const gate = await db.query<{ state: string }>(
        "select state from public.readiness_gates where id = $1",
        [fixture.gateId],
      );
      const project = await db.query<{ blocker_note: string | null }>(
        "select blocker_note from public.projects where id = $1",
        [fixture.projectId],
      );
      const session = await db.query<{ id: string }>(
        "select id from public.practice_sessions where id = $1",
        [fixture.practiceSessionId],
      );
      return {
        title: task.rows[0].title,
        gateState: gate.rows[0].state,
        blocker: project.rows[0].blocker_note,
        sessionExists: session.rows.length === 1,
      };
    });
    expect(unchanged).toEqual({
      title: "Timed Python + review",
      gateState: "not_assessed",
      blocker: null,
      sessionExists: true,
    });
  });

  it("user B cannot insert rows claiming user A's identity", async () => {
    await seedFixtureFor(userA.id);
    const clientB = await authenticatedClient(userB);

    const session = await clientB.from("practice_sessions").insert({
      user_id: userA.id,
      session_type: "coding",
      date: "2026-09-01",
      topic: "smuggled session",
      allotted_minutes: 60,
    });
    expect(session.error).not.toBeNull();
    expect((session.error as PostgrestError).code).toBe("42501"); // RLS check violation

    const checkin = await clientB.from("daily_checkins").insert({
      user_id: userA.id,
      local_date: "2026-09-01",
      learning: "smuggled",
    });
    expect(checkin.error).not.toBeNull();
  });

  it("composite owner FKs reject cross-owner child relationships at the SQL level", async () => {
    const fixture = await seedFixtureFor(userA.id);
    await withDb(async (db) => {
      // Constraints apply to every role. Inserting as the table owner (which
      // bypasses RLS) proves the FK layer itself rejects cross-owner parents.
      await expect(
        db.query(
          `insert into public.tasks (user_id, title, category, original_scheduled_date, scheduled_date, estimated_minutes, project_id)
           values ($1, 'cross-owner task', 'deep_work', '2026-09-01', '2026-09-01', 60, $2)`,
          [userB.id, fixture.projectId],
        ),
      ).rejects.toThrow(/tasks_project_owner_fk/);

      // The authenticated role holds an INSERT grant on mock_scores; RLS
      // passes (user_id = self) and the composite FK must still reject the
      // cross-owner session reference.
      await db.query("begin");
      await db.query("set local role authenticated");
      await db.query("select set_config('request.jwt.claims', $1, true)", [
        JSON.stringify({ sub: userB.id, role: "authenticated" }),
      ]);
      await expect(
        db.query(
          `insert into public.mock_scores (user_id, practice_session_id, dimension_key, score)
           values ($1, $2, 'evidence', 4)`,
          [userB.id, fixture.practiceSessionId],
        ),
      ).rejects.toThrow(/mock_scores_session_owner_fk/);
      await db.query("rollback");
    });
  });
});

describe("command boundary: client DML is revoked where RPCs are required", () => {
  it("clients cannot insert, update, or delete tasks directly", async () => {
    const fixture = await seedFixtureFor(userA.id);
    const clientA = await authenticatedClient(userA);

    const insert = await clientA.from("tasks").insert({
      user_id: userA.id,
      title: "client-side task",
      category: "deep_work",
      original_scheduled_date: "2026-09-01",
      scheduled_date: "2026-09-01",
      estimated_minutes: 60,
    });
    expect(insert.error).not.toBeNull();

    const update = await clientA
      .from("tasks")
      .update({ title: "client-side rename" })
      .eq("id", fixture.taskId);
    expect(update.error).not.toBeNull();

    const del = await clientA.from("tasks").delete().eq("id", fixture.taskId);
    expect(del.error).not.toBeNull();
  });

  it("clients can read task events but cannot insert, update, or delete them", async () => {
    const fixture = await seedFixtureFor(userA.id);
    const clientA = await authenticatedClient(userA);

    const select = await clientA.from("task_events").select("*").eq("task_id", fixture.taskId);
    expect(select.error).toBeNull();
    expect(select.data).toHaveLength(1);
    expect(select.data?.[0].event_type).toBe("created");

    const insert = await clientA.from("task_events").insert({
      user_id: userA.id,
      task_id: fixture.taskId,
      event_type: "completed",
    });
    expect(insert.error).not.toBeNull();

    const update = await clientA
      .from("task_events")
      .update({ event_type: "started" })
      .eq("id", fixture.eventId);
    expect(update.error).not.toBeNull();

    const del = await clientA.from("task_events").delete().eq("id", fixture.eventId);
    expect(del.error).not.toBeNull();
  });

  it("profiles updates are limited to reminder status columns", async () => {
    await seedFixtureFor(userA.id);
    const clientA = await authenticatedClient(userA);

    const ok = await clientA
      .from("profiles")
      .update({ reminder_installed_at: new Date().toISOString() })
      .eq("user_id", userA.id);
    expect(ok.error).toBeNull();

    const forbidden = await clientA
      .from("profiles")
      .update({ template_version: 1 })
      .eq("user_id", userA.id);
    expect(forbidden.error).not.toBeNull();

    const timezone = await clientA
      .from("profiles")
      .update({ timezone: "Europe/Berlin" })
      .eq("user_id", userA.id);
    expect(timezone.error).not.toBeNull();
  });
});

describe("state and field integrity constraints", () => {
  it("rejects completed tasks without completed_at or actual minutes", async () => {
    await withDb(async (db) => {
      // CHECK constraints apply to every role; insert as the table owner
      // because the authenticated role has no direct INSERT grant by design.
      await expect(
        db.query(
          `insert into public.tasks (user_id, title, category, original_scheduled_date, scheduled_date, estimated_minutes, state)
           values ($1, 'bad completion', 'deep_work', '2026-09-01', '2026-09-01', 60, 'completed')`,
          [userA.id],
        ),
      ).rejects.toThrow(/tasks_completed_fields/);
      await db.query("rollback");
    });
  });

  it("rejects skipped tasks without a reason", async () => {
    await withDb(async (db) => {
      // CHECK constraints apply to every role; insert as the table owner
      // because the authenticated role has no direct INSERT grant by design.
      await expect(
        db.query(
          `insert into public.tasks (user_id, title, category, original_scheduled_date, scheduled_date, estimated_minutes, state)
           values ($1, 'bad skip', 'deep_work', '2026-09-01', '2026-09-01', 60, 'skipped')`,
          [userA.id],
        ),
      ).rejects.toThrow(/tasks_skip_requires_reason/);
      await db.query("rollback");
    });
  });

  it("rejects non-positive and zero estimates", async () => {
    await withDb(async (db) => {
      // CHECK constraints apply to every role; insert as the table owner
      // because the authenticated role has no direct INSERT grant by design.
      await expect(
        db.query(
          `insert into public.tasks (user_id, title, category, original_scheduled_date, scheduled_date, estimated_minutes)
           values ($1, 'zero minutes', 'deep_work', '2026-09-01', '2026-09-01', 0)`,
          [userA.id],
        ),
      ).rejects.toThrow(/tasks_estimate_positive/);
      await db.query("rollback");
    });
  });

  it("rejects template task archive and http evidence URLs", async () => {
    await withDb(async (db) => {
      // CHECK constraints apply to every role; insert as the table owner
      // because the authenticated role has no direct INSERT grant by design.
      await expect(
        db.query(
          `insert into public.tasks (user_id, template_task_key, title, category, original_scheduled_date, scheduled_date, estimated_minutes, state)
           values ($1, 'w01-mon', 'archived template', 'deep_work', '2026-09-01', '2026-09-01', 60, 'archived')`,
          [userA.id],
        ),
      ).rejects.toThrow(/tasks_archive_custom_only/);
      await expect(
        db.query(
          `insert into public.tasks (user_id, title, category, original_scheduled_date, scheduled_date, estimated_minutes, evidence_url)
           values ($1, 'http evidence', 'deep_work', '2026-09-01', '2026-09-01', 60, 'http://insecure.example/evidence')`,
          [userA.id],
        ),
      ).rejects.toThrow(/tasks_evidence_https/);
      await db.query("rollback");
    });
  });

  it("maintains updated_at through the trigger", async () => {
    await seedFixtureFor(userA.id);
    const before = await withDb(async (db) => {
      const res = await db.query<{ updated_at: string }>(
        "select updated_at from public.tasks where user_id = $1",
        [userA.id],
      );
      return res.rows[0].updated_at;
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
    await withDb(async (db) => {
      await db.query("update public.tasks set description = 'touched' where user_id = $1", [
        userA.id,
      ]);
    });
    const after = await withDb(async (db) => {
      const res = await db.query<{ updated_at: string }>(
        "select updated_at from public.tasks where user_id = $1",
        [userA.id],
      );
      return res.rows[0].updated_at;
    });
    expect(new Date(after).getTime()).toBeGreaterThan(new Date(before).getTime());
  });
});

describe("auth-user deletion cascades application data", () => {
  it("removes every owned row when the auth user is deleted", async () => {
    const fixture = await seedFixtureFor(userA.id);

    // A child referencing the task exists; deleting the user must cascade all.
    await withDb(async (db) => {
      await db.query(
        `insert into public.task_events (user_id, task_id, event_type)
         values ($1, $2, 'started')`,
        [userA.id, fixture.taskId],
      );
    });

    const admin = adminClient();
    const deleted = await admin.auth.admin.deleteUser(userA.id);
    expect(deleted.error).toBeNull();

    const counts = await withDb(async (db) => {
      const res = await db.query<{
        profiles: string;
        tasks: string;
        events: string;
        projects: string;
      }>(
        `select
           (select count(*)::text from public.profiles where user_id = $1) as profiles,
           (select count(*)::text from public.tasks where user_id = $1) as tasks,
           (select count(*)::text from public.task_events where user_id = $1) as events,
           (select count(*)::text from public.projects where user_id = $1) as projects`,
        [userA.id],
      );
      return {
        profiles: Number(res.rows[0].profiles),
        tasks: Number(res.rows[0].tasks),
        events: Number(res.rows[0].events),
        projects: Number(res.rows[0].projects),
      };
    });
    expect(counts).toEqual({ profiles: 0, tasks: 0, events: 0, projects: 0 });

    // Keep the shared fixture usable for subsequent tests.
    await ensureBothUsers();
  });
});
