/**
 * Generates the database template artifact from the canonical TypeScript
 * template (todo.md Task 7; WEBAPP_SPEC.md section 11).
 *
 * Outputs:
 *  - supabase/templates/plan_v1.json  (artifact payload + content digest)
 *  - supabase/migrations/20260829020000_template_artifact.sql (generated
 *    migration loading the artifact into private.template_artifacts)
 *
 * Deterministic UUIDs (uuid5 over stable keys) make seed_plan_v1 idempotent:
 * re-inserting the same rows conflicts on primary key and does nothing.
 * CI regenerates this file and fails when it is out of sync with the
 * TypeScript template.
 *
 * Usage: npx tsx scripts/generate-template-artifacts.mjs
 */

import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { TEMPLATE_V1, taskDate } from "../src/template/templateV1";

const root = fileURLToPath(new URL("..", import.meta.url));

/** RFC 4122 section 4.3 name-based UUID (SHA-1). */
function uuid5(namespaceUuid, name) {
  const nsBytes = Buffer.from(namespaceUuid.replaceAll("-", ""), "hex");
  const hash = createHash("sha1").update(nsBytes).update(Buffer.from(name, "utf8")).digest();
  const bytes = [...hash.subarray(0, 16)];
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = Buffer.from(bytes).toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

// Fixed application namespace for template v1 identifiers.
const NAMESPACE = uuid5("6ba7b810-9dad-11d1-80b4-00c04fd430c8", "ml-prep/template-v1");

const weekId = (week) => uuid5(NAMESPACE, `week:${week}`);
const taskId = (key) => uuid5(NAMESPACE, `task:${key}`);
const projectId = (key) => uuid5(NAMESPACE, `project:${key}`);
const milestoneId = (key) => uuid5(NAMESPACE, `milestone:${key}`);
const gateId = (role, key) => uuid5(NAMESPACE, `gate:${role}/${key}`);

// Canonical shape: identical to templateContentDigest() in the frontend.
const tasks = TEMPLATE_V1.tasks.map((t) => ({ ...t, date: taskDate(t) }));
const canonical = {
  weeks: TEMPLATE_V1.weeks,
  tasks,
  projects: TEMPLATE_V1.projects,
  gates: TEMPLATE_V1.gates,
};
const digest = createHash("sha256").update(JSON.stringify(canonical)).digest("hex");

// Database artifact payload: canonical data plus resolved identifiers and the
// Post-Training swap definition derived from the template itself.
const payload = {
  version: 1,
  window_start: TEMPLATE_V1.windowStart,
  window_end: TEMPLATE_V1.windowEnd,
  weeks: TEMPLATE_V1.weeks.map((w) => ({ id: weekId(w.week), ...w })),
  tasks: tasks.map((t) => ({
    id: taskId(t.key),
    key: t.key,
    week: t.week,
    date: t.date,
    category: t.category,
    minutes: t.minutes,
    title: t.title,
    roles: t.roles,
    project: t.project ?? null,
    fixed_deadline: t.fixedDeadline,
    optional_track: t.optionalTrack,
  })),
  projects: TEMPLATE_V1.projects.map((p) => ({
    id: projectId(p.key),
    key: p.key,
    name: p.name,
    target_roles: p.targetRoles,
    budget_minutes: p.budgetMinutes,
    state: p.state,
    purpose: p.purpose,
    milestones: p.milestones.map((m) => ({
      id: milestoneId(m.key),
      key: m.key,
      title: m.title,
      acceptance: m.acceptance,
      target_date: m.targetDate,
      is_completion_gate: m.isCompletionGate,
      sort_order: m.sortOrder,
    })),
  })),
  gates: TEMPLATE_V1.gates.map((g) => ({
    id: gateId(g.role, g.key),
    role: g.role,
    key: g.key,
    title: g.title,
  })),
  swap: {
    deactivate_keys: TEMPLATE_V1.tasks
      .filter((t) => t.swapGroup === "post_training")
      .map((t) => t.key),
    deactivate_minutes: TEMPLATE_V1.tasks
      .filter((t) => t.swapGroup === "post_training")
      .reduce((s, t) => s + t.minutes, 0),
    activate_keys: TEMPLATE_V1.tasks.filter((t) => t.optionalTrack).map((t) => t.key),
    activate_minutes: TEMPLATE_V1.tasks
      .filter((t) => t.optionalTrack)
      .reduce((s, t) => s + t.minutes, 0),
  },
};

if (payload.swap.deactivate_minutes !== payload.swap.activate_minutes) {
  throw new Error(
    `Swap inequality: deactivate ${payload.swap.deactivate_minutes} vs activate ${payload.swap.activate_minutes}`,
  );
}

mkdirSync(join(root, "supabase", "templates"), { recursive: true });
writeFileSync(
  join(root, "supabase", "templates", "plan_v1.json"),
  `${JSON.stringify({ content_digest: digest, payload }, null, 1)}\n`,
);

const migration = `-- GENERATED FILE - do not edit by hand.
-- Source: src/template/templateV1.ts via scripts/generate-template-artifacts.mjs
-- Template v1 database artifact (WEBAPP_SPEC.md section 11). Consumed only by
-- the seed_plan_v1() RPC; the private schema is not exposed through the API.

create schema if not exists private;

create table if not exists private.template_artifacts (
  version integer primary key,
  payload jsonb not null,
  content_digest text not null,
  created_at timestamptz not null default now()
);

revoke all on private.template_artifacts from anon, authenticated;

delete from private.template_artifacts where version = 1;

insert into private.template_artifacts (version, payload, content_digest)
values (1, $json$${JSON.stringify(payload)}$json$, '${digest}');
`;

writeFileSync(
  join(root, "supabase", "migrations", "20260829020000_template_artifact.sql"),
  migration,
);

console.log(
  `template artifact written (digest ${digest.slice(0, 12)}..., ${payload.tasks.length} tasks)`,
);
