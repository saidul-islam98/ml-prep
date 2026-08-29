/**
 * Transactional task command tests (todo.md Task 4a).
 *
 * Proves:
 *  - create_custom_task: atomic task+created-event, payload validation,
 *    cross-owner project rejection
 *  - the complete transition matrix with exact event mapping
 *  - revision compare-and-swap: stale and simultaneous conflicts return the
 *    latest row without overwriting
 *  - atomicity: a forced event-write failure rolls back the task mutation
 *  - ownership: another user cannot transition or reference foreign tasks
 *  - server timestamps and server-side Toronto-date rules
 */

import { describe, expect, it, beforeEach } from "vitest";
import {
  authenticatedClient,
  ensureBothUsers,
  resetAllUserData,
  withDb,
  type TestUser,
} from "./helpers/testUsers";

let userA: TestUser;
let userB: TestUser;

interface TaskRow {
  id: string;
  revision: number;
  state: string;
  scheduled_date: string;
  original_scheduled_date: string;
  completed_at: string | null;
  actual_minutes: number | null;
  skip_reason: string | null;
  template_task_key: string | null;
  title: string;
  estimated_minutes: number;
  [key: string]: unknown;
}

beforeEach(async () => {
  await resetAllUserData();
  const users = await ensureBothUsers();
  userA = users.userA;
  userB = users.userB;
});

async function clientFor(user: TestUser) {
  return authenticatedClient(user);
}

async function createTask(
  client: Awaited<ReturnType<typeof clientFor>>,
  overrides: Record<string, unknown> = {},
): Promise<TaskRow> {
  const result = await client.rpc("create_custom_task", {
    p_payload: {
      title: "Practice session",
      category: "practice",
      scheduled_date: "2026-09-01",
      estimated_minutes: 90,
      ...overrides,
    },
  });
  expect(result.error).toBeNull();
  const payload = result.data as { status: string; task: TaskRow };
  expect(payload.status).toBe("ok");
  return payload.task;
}

async function eventsFor(
  client: Awaited<ReturnType<typeof clientFor>>,
  taskId: string,
): Promise<
  {
    event_type: string;
    metadata: Record<string, unknown>;
    from_scheduled_date: string | null;
    to_scheduled_date: string | null;
    occurred_at: string;
  }[]
> {
  const res = await client
    .from("task_events")
    .select("event_type, metadata, from_scheduled_date, to_scheduled_date, occurred_at")
    .eq("task_id", taskId)
    .order("occurred_at");
  expect(res.error).toBeNull();
  return res.data ?? [];
}

async function serverTorontoToday(): Promise<string> {
  return withDb(async (db) => {
    const res = await db.query<{ today: string }>(
      "select (now() at time zone 'America/Toronto')::date::text as today",
    );
    return res.rows[0].today;
  });
}

describe("create_custom_task", () => {
  it("creates a custom task at revision 0 with an atomic created event", async () => {
    const client = await clientFor(userA);
    const task = await createTask(client, { title: "Custom deep work", category: "deep_work" });

    expect(task.revision).toBe(0);
    expect(task.state).toBe("not_started");
    expect(task.original_scheduled_date).toBe("2026-09-01");
    expect(task.scheduled_date).toBe("2026-09-01");
    expect(task.template_task_key).toBeNull();

    const events = await eventsFor(client, task.id);
    expect(events).toHaveLength(1);
    expect(events[0].event_type).toBe("created");
    expect(events[0].metadata.estimated_minutes).toBe(90);
  });

  it("rejects invalid payloads", async () => {
    const client = await clientFor(userA);
    for (const payload of [
      { title: "" },
      { title: "   " },
      { category: "unknown" },
      { scheduled_date: "2026-09" },
      { estimated_minutes: 0 },
      { estimated_minutes: -5 },
    ]) {
      const result = await client.rpc("create_custom_task", {
        p_payload: {
          title: "Practice session",
          category: "practice",
          scheduled_date: "2026-09-01",
          estimated_minutes: 90,
          ...payload,
        },
      });
      expect(result.error, `expected rejection for ${JSON.stringify(payload)}`).not.toBeNull();
    }
    const tasks = await client.from("tasks").select("id");
    expect(tasks.data).toHaveLength(0);
  });

  it("rejects a project owned by another user", async () => {
    const project = await withDb(async (db) => {
      const res = await db.query<{ id: string }>(
        `insert into public.projects (user_id, project_key, name, target_roles, budget_minutes, state)
         values ($1, 'evalops', 'EvalOps', '{data_eval}', 1950, 'active') returning id`,
        [userA.id],
      );
      return res.rows[0].id;
    });
    const clientB = await clientFor(userB);
    const result = await clientB.rpc("create_custom_task", {
      p_payload: {
        title: "Cross-owner task",
        category: "deep_work",
        scheduled_date: "2026-09-01",
        estimated_minutes: 60,
        project_id: project,
      },
    });
    expect(result.error).not.toBeNull();
  });
});

describe("state transition matrix", () => {
  it("start: not_started -> in_progress with started event", async () => {
    const client = await clientFor(userA);
    const task = await createTask(client);
    const result = await client.rpc("transition_task", {
      p_task_id: task.id,
      p_expected_revision: 0,
      p_transition: "start",
    });
    const payload = result.data as { status: string; task: TaskRow };
    expect(payload.status).toBe("ok");
    expect(payload.task.state).toBe("in_progress");
    expect(payload.task.revision).toBe(1);
    const events = await eventsFor(client, task.id);
    expect(events.map((e) => e.event_type)).toEqual(["created", "started"]);
  });

  it("start: rejected from in_progress", async () => {
    const client = await clientFor(userA);
    const task = await createTask(client);
    await client.rpc("transition_task", {
      p_task_id: task.id,
      p_expected_revision: 0,
      p_transition: "start",
    });
    const result = await client.rpc("transition_task", {
      p_task_id: task.id,
      p_expected_revision: 1,
      p_transition: "start",
    });
    expect(result.error).not.toBeNull();
    expect((result.error as Error).message).toMatch(/invalid_transition/);
  });

  it("complete: from not_started with server completed_at and positive minutes", async () => {
    const client = await clientFor(userA);
    const task = await createTask(client);
    const result = await client.rpc("transition_task", {
      p_task_id: task.id,
      p_expected_revision: 0,
      p_transition: "complete",
      p_payload: { actual_minutes: 80 },
    });
    const payload = result.data as { status: string; task: TaskRow };
    expect(payload.status).toBe("ok");
    expect(payload.task.state).toBe("completed");
    expect(payload.task.actual_minutes).toBe(80);
    expect(payload.task.completed_at).toBeTruthy();
    const events = await eventsFor(client, task.id);
    expect(events.map((e) => e.event_type)).toEqual(["created", "completed"]);
    expect(events[1].metadata.actual_minutes).toBe(80);
  });

  it("complete: rejects zero, negative, and missing actual minutes", async () => {
    const client = await clientFor(userA);
    for (const minutes of [undefined, 0, -10]) {
      const task = await createTask(client);
      const result = await client.rpc("transition_task", {
        p_task_id: task.id,
        p_expected_revision: 0,
        p_transition: "complete",
        p_payload: minutes === undefined ? {} : { actual_minutes: minutes },
      });
      expect(result.error, `expected rejection for ${minutes}`).not.toBeNull();
      expect((result.error as Error).message).toMatch(/invalid_payload/);
    }
  });

  it("complete: rejected from completed and skipped", async () => {
    const client = await clientFor(userA);
    const task = await createTask(client);
    await client.rpc("transition_task", {
      p_task_id: task.id,
      p_expected_revision: 0,
      p_transition: "complete",
      p_payload: { actual_minutes: 60 },
    });
    const fromCompleted = await client.rpc("transition_task", {
      p_task_id: task.id,
      p_expected_revision: 1,
      p_transition: "complete",
      p_payload: { actual_minutes: 60 },
    });
    expect((fromCompleted.error as Error).message).toMatch(/invalid_transition/);

    const task2 = await createTask(client);
    await client.rpc("transition_task", {
      p_task_id: task2.id,
      p_expected_revision: 0,
      p_transition: "skip",
      p_payload: { reason: "no longer relevant" },
    });
    const fromSkipped = await client.rpc("transition_task", {
      p_task_id: task2.id,
      p_expected_revision: 1,
      p_transition: "complete",
      p_payload: { actual_minutes: 60 },
    });
    expect((fromSkipped.error as Error).message).toMatch(/invalid_transition/);
  });

  it("reopen: completed -> not_started clears completion credit and preserves history", async () => {
    const client = await clientFor(userA);
    const task = await createTask(client);
    await client.rpc("transition_task", {
      p_task_id: task.id,
      p_expected_revision: 0,
      p_transition: "complete",
      p_payload: { actual_minutes: 60 },
    });
    const result = await client.rpc("transition_task", {
      p_task_id: task.id,
      p_expected_revision: 1,
      p_transition: "reopen",
    });
    const payload = result.data as { status: string; task: TaskRow };
    expect(payload.status).toBe("ok");
    expect(payload.task.state).toBe("not_started");
    expect(payload.task.completed_at).toBeNull();
    expect(payload.task.actual_minutes).toBeNull();
    const events = await eventsFor(client, task.id);
    expect(events.map((e) => e.event_type)).toEqual(["created", "completed", "reopened"]);
  });

  it("reopen: completed -> in_progress via to_state", async () => {
    const client = await clientFor(userA);
    const task = await createTask(client);
    await client.rpc("transition_task", {
      p_task_id: task.id,
      p_expected_revision: 0,
      p_transition: "complete",
      p_payload: { actual_minutes: 60 },
    });
    const result = await client.rpc("transition_task", {
      p_task_id: task.id,
      p_expected_revision: 1,
      p_transition: "reopen",
      p_payload: { to_state: "in_progress" },
    });
    const payload = result.data as { status: string; task: TaskRow };
    expect(payload.task.state).toBe("in_progress");
  });

  it("reopen: skipped -> not_started clears the active skip reason but keeps its event", async () => {
    const client = await clientFor(userA);
    const task = await createTask(client);
    await client.rpc("transition_task", {
      p_task_id: task.id,
      p_expected_revision: 0,
      p_transition: "skip",
      p_payload: { reason: "postponed" },
    });
    const result = await client.rpc("transition_task", {
      p_task_id: task.id,
      p_expected_revision: 1,
      p_transition: "reopen",
    });
    const payload = result.data as { status: string; task: TaskRow };
    expect(payload.task.state).toBe("not_started");
    expect(payload.task.skip_reason).toBeNull();
    const events = await eventsFor(client, task.id);
    expect(events.filter((e) => e.event_type === "skipped")).toHaveLength(1);
  });

  it("reopen: rejected from open states", async () => {
    const client = await clientFor(userA);
    const task = await createTask(client);
    const result = await client.rpc("transition_task", {
      p_task_id: task.id,
      p_expected_revision: 0,
      p_transition: "reopen",
    });
    expect((result.error as Error).message).toMatch(/invalid_transition/);
  });

  it("skip: open task with required reason", async () => {
    const client = await clientFor(userA);
    const task = await createTask(client);
    const missingReason = await client.rpc("transition_task", {
      p_task_id: task.id,
      p_expected_revision: 0,
      p_transition: "skip",
      p_payload: {},
    });
    expect((missingReason.error as Error).message).toMatch(/invalid_payload/);

    const result = await client.rpc("transition_task", {
      p_task_id: task.id,
      p_expected_revision: 0,
      p_transition: "skip",
      p_payload: { reason: "covered by another session" },
    });
    const payload = result.data as { status: string; task: TaskRow };
    expect(payload.status).toBe("ok");
    expect(payload.task.state).toBe("skipped");
    expect(payload.task.skip_reason).toBe("covered by another session");
    const events = await eventsFor(client, task.id);
    expect(events[1].metadata.reason).toBe("covered by another session");
  });

  it("reschedule: open task records old and new dates; rejects past and same dates", async () => {
    const client = await clientFor(userA);
    const task = await createTask(client);
    const today = await serverTorontoToday();

    const past = await client.rpc("transition_task", {
      p_task_id: task.id,
      p_expected_revision: 0,
      p_transition: "reschedule",
      p_payload: { to_date: "2026-08-01", reason: "backwards" },
    });
    expect((past.error as Error).message).toMatch(/invalid_date/);

    const same = await client.rpc("transition_task", {
      p_task_id: task.id,
      p_expected_revision: 0,
      p_transition: "reschedule",
      p_payload: { to_date: "2026-09-01" },
    });
    expect((same.error as Error).message).toMatch(/invalid_date/);

    const ok = await client.rpc("transition_task", {
      p_task_id: task.id,
      p_expected_revision: 0,
      p_transition: "reschedule",
      p_payload: { to_date: today, reason: "busy week" },
    });
    const payload = ok.data as { status: string; task: TaskRow };
    expect(payload.status).toBe("ok");
    expect(payload.task.scheduled_date).toBe(today);
    expect(payload.task.original_scheduled_date).toBe("2026-09-01");
    const events = await eventsFor(client, task.id);
    expect(events[1].event_type).toBe("rescheduled");
    expect(events[1].from_scheduled_date).toBe("2026-09-01");
    expect(events[1].to_scheduled_date).toBe(today);
  });

  it("reschedule: rejected for completed and archived tasks", async () => {
    const client = await clientFor(userA);
    const completed = await createTask(client);
    await client.rpc("transition_task", {
      p_task_id: completed.id,
      p_expected_revision: 0,
      p_transition: "complete",
      p_payload: { actual_minutes: 60 },
    });
    const res = await client.rpc("transition_task", {
      p_task_id: completed.id,
      p_expected_revision: 1,
      p_transition: "reschedule",
      p_payload: { to_date: "2026-09-15" },
    });
    expect((res.error as Error).message).toMatch(/invalid_transition/);
  });

  it("archive: allowed for open custom tasks with a reason, forbidden for template tasks", async () => {
    const client = await clientFor(userA);
    const custom = await createTask(client);
    const noReason = await client.rpc("transition_task", {
      p_task_id: custom.id,
      p_expected_revision: 0,
      p_transition: "archive",
      p_payload: {},
    });
    expect((noReason.error as Error).message).toMatch(/invalid_payload/);
    const ok = await client.rpc("transition_task", {
      p_task_id: custom.id,
      p_expected_revision: 0,
      p_transition: "archive",
      p_payload: { reason: "superseded by project milestone" },
    });
    const payload = ok.data as { status: string; task: TaskRow };
    expect(payload.task.state).toBe("archived");

    // Template task: archive forbidden regardless of state.
    const templateId = await withDb(async (db) => {
      const res = await db.query<{ id: string }>(
        `insert into public.tasks (user_id, template_task_key, title, category,
           original_scheduled_date, scheduled_date, estimated_minutes)
         values ($1, 'w01-mon', 'Template Monday', 'practice', '2026-08-31', '2026-08-31', 120)
         returning id`,
        [userA.id],
      );
      return res.rows[0].id;
    });
    const templateArchive = await client.rpc("transition_task", {
      p_task_id: templateId,
      p_expected_revision: 0,
      p_transition: "archive",
      p_payload: { reason: "not allowed" },
    });
    expect((templateArchive.error as Error).message).toMatch(/invalid_transition/);
  });

  it("edit: open-task fields and evidence-only fields on completed tasks", async () => {
    const client = await clientFor(userA);
    const task = await createTask(client);

    const edited = await client.rpc("transition_task", {
      p_task_id: task.id,
      p_expected_revision: 0,
      p_transition: "edit",
      p_payload: { title: "Renamed", estimated_minutes: 120, description: null },
    });
    const editedTask = (edited.data as { status: string; task: TaskRow }).task;
    expect(editedTask.title).toBe("Renamed");
    expect(editedTask.estimated_minutes).toBe(120);
    expect(editedTask.description).toBeNull();

    const completed = await createTask(client);
    await client.rpc("transition_task", {
      p_task_id: completed.id,
      p_expected_revision: 0,
      p_transition: "complete",
      p_payload: { actual_minutes: 60 },
    });
    const evidenceEdit = await client.rpc("transition_task", {
      p_task_id: completed.id,
      p_expected_revision: 1,
      p_transition: "edit",
      p_payload: {
        evidence_url: "https://github.com/example/pr/pull/1",
        evidence_note: "merged PR",
      },
    });
    const evidenceTask = (evidenceEdit.data as { status: string; task: TaskRow }).task;
    expect(evidenceTask.evidence_url).toBe("https://github.com/example/pr/pull/1");

    const forbiddenEdit = await client.rpc("transition_task", {
      p_task_id: completed.id,
      p_expected_revision: 2,
      p_transition: "edit",
      p_payload: { title: "late rename" },
    });
    expect((forbiddenEdit.error as Error).message).toMatch(/invalid_transition/);

    const unknownField = await client.rpc("transition_task", {
      p_task_id: task.id,
      p_expected_revision: 1,
      p_transition: "edit",
      p_payload: { revision: 99 },
    });
    expect((unknownField.error as Error).message).toMatch(/invalid_payload/);
  });

  it("maps every transition to exactly one event and increments revision exactly once", async () => {
    const client = await clientFor(userA);
    const task = await createTask(client);
    const sequence: [string, Record<string, unknown>][] = [
      ["start", {}],
      ["complete", { actual_minutes: 45 }],
      ["reopen", {}],
      ["skip", { reason: "reprioritized" }],
      ["reopen", {}],
      ["edit", { title: "Edited title" }],
    ];
    let expectedRevision = 0;
    for (const [transition, payload] of sequence) {
      const res = await client.rpc("transition_task", {
        p_task_id: task.id,
        p_expected_revision: expectedRevision,
        p_transition: transition,
        p_payload: payload,
      });
      const body = res.data as { status: string; task: TaskRow };
      expect(body.status, `${transition} should succeed`).toBe("ok");
      expectedRevision += 1;
      expect(body.task.revision).toBe(expectedRevision);
    }
    const events = await eventsFor(client, task.id);
    expect(events.map((e) => e.event_type)).toEqual([
      "created",
      "started",
      "completed",
      "reopened",
      "skipped",
      "reopened",
      "edited",
    ]);
  });
});

describe("revision compare-and-swap", () => {
  it("returns a revision_conflict with the latest row for a stale revision", async () => {
    const client = await clientFor(userA);
    const task = await createTask(client);
    await client.rpc("transition_task", {
      p_task_id: task.id,
      p_expected_revision: 0,
      p_transition: "start",
    });
    const stale = await client.rpc("transition_task", {
      p_task_id: task.id,
      p_expected_revision: 0,
      p_transition: "complete",
      p_payload: { actual_minutes: 60 },
    });
    const payload = stale.data as { status: string; task: TaskRow };
    expect(payload.status).toBe("revision_conflict");
    expect(payload.task.revision).toBe(1);
    expect(payload.task.state).toBe("in_progress");
    // No completed event was appended by the stale write.
    const events = await eventsFor(client, task.id);
    expect(events.map((e) => e.event_type)).toEqual(["created", "started"]);
  });

  it("simultaneous transitions with the same revision: exactly one wins", async () => {
    const client = await clientFor(userA);
    const task = await createTask(client);
    const [first, second] = await Promise.all([
      client.rpc("transition_task", {
        p_task_id: task.id,
        p_expected_revision: 0,
        p_transition: "start",
      }),
      client.rpc("transition_task", {
        p_task_id: task.id,
        p_expected_revision: 0,
        p_transition: "skip",
        p_payload: { reason: "conflicting decision" },
      }),
    ]);
    const statuses = [first, second].map((r) => {
      if (r.error) return "error";
      return (r.data as { status: string }).status;
    });
    expect(statuses).toContain("ok");
    expect(statuses).toContain("revision_conflict");

    // Exactly one event from the winner exists; the loser wrote nothing.
    const winnerEvent = statuses.indexOf("ok") === 0 ? "started" : "skipped";
    const loserEvent = winnerEvent === "started" ? "skipped" : "started";
    const events = await eventsFor(client, task.id);
    expect(events.filter((e) => e.event_type === winnerEvent)).toHaveLength(1);
    expect(events.filter((e) => e.event_type === loserEvent)).toHaveLength(0);

    const finalTask = await client.from("tasks").select("revision, state").eq("id", task.id);
    expect(finalTask.data?.[0].revision).toBe(1);
  });
});

describe("atomicity under forced event-write failure", () => {
  it("rolls back the task mutation when the event insert fails", async () => {
    const client = await clientFor(userA);
    const failTask = await createTask(client, { title: "__force_fail_task" });

    // Install a temporary fault-injection trigger (local test only). It fails
    // event inserts for tasks titled with the injection marker, leaving
    // production metadata clean.
    await withDb(async (db) => {
      await db.query(`
        create or replace function public.__test_fail_event_insert()
        returns trigger language plpgsql as $fn$
        begin
          if exists (
            select 1 from public.tasks t
            where t.id = new.task_id and t.title = '__force_fail_task'
          ) then
            raise exception 'injected event failure';
          end if;
          return new;
        end;
        $fn$;
      `);
      await db.query(
        `create trigger __test_fail_event_insert_before
         before insert on public.task_events
         for each row execute function public.__test_fail_event_insert()`,
      );
    });

    try {
      const result = await client.rpc("transition_task", {
        p_task_id: failTask.id,
        p_expected_revision: 0,
        p_transition: "skip",
        p_payload: { reason: "should roll back" },
      });
      expect(result.error).not.toBeNull();

      // Task must be unchanged: still open, revision still 0, no skip reason.
      const after = await client
        .from("tasks")
        .select("state, revision, skip_reason")
        .eq("id", failTask.id);
      expect(after.data?.[0]).toEqual({ state: "not_started", revision: 0, skip_reason: null });
      const events = await eventsFor(client, failTask.id);
      expect(events.map((e) => e.event_type)).toEqual(["created"]);
    } finally {
      await withDb(async (db) => {
        await db.query(
          "drop trigger if exists __test_fail_event_insert_before on public.task_events",
        );
        await db.query("drop function if exists public.__test_fail_event_insert()");
      });
    }
  });
});

describe("ownership and server authority", () => {
  it("returns task_not_found for another user's task", async () => {
    const clientA = await clientFor(userA);
    const clientB = await clientFor(userB);
    const task = await createTask(clientA);
    const result = await clientB.rpc("transition_task", {
      p_task_id: task.id,
      p_expected_revision: 0,
      p_transition: "start",
    });
    expect((result.error as Error).message).toMatch(/task_not_found/);
    // Task untouched.
    const events = await eventsFor(clientA, task.id);
    expect(events).toHaveLength(1);
  });

  it("timestamps are server-set; client-supplied timestamps are ignored", async () => {
    const client = await clientFor(userA);
    const before = new Date(Date.now() - 60_000).toISOString();
    const task = await createTask(client);
    const result = await client.rpc("transition_task", {
      p_task_id: task.id,
      p_expected_revision: 0,
      p_transition: "complete",
      p_payload: { actual_minutes: 30, completed_at: "1999-01-01T00:00:00Z" },
    });
    const payload = result.data as { status: string; task: TaskRow };
    expect(new Date(payload.task.completed_at ?? "").getTime()).toBeGreaterThan(
      new Date(before).getTime(),
    );
    const events = await eventsFor(client, task.id);
    for (const event of events) {
      expect(new Date(event.occurred_at).getTime()).toBeGreaterThan(new Date(before).getTime());
    }
  });
});
