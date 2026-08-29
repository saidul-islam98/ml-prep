<!--
Synchronized copy - edit the source, not this file.
Source: /home/ivlr/Study/Job Search/cohere/tasks/todo.md
Synchronized: 2026-08-29
Re-sync procedure: copy the source over this file and update this date.
-->

# Cohere Preparation Tracker checklist

Specification: `docs/WEBAPP_SPEC.md`  
Plan: `tasks/plan.md`

Each task must leave its focused tests green. Checkpoints also run typecheck, lint, all tests, and production build.

## Phase 1: eliminate architecture risk

### Task 1 — Scaffold and Pages pipeline

- [x] Create React/TypeScript/Vite shell, hash routes, test/lint/typecheck commands, and Pages workflow. (2026-08-29)
- [x] Prove the production artifact loads under a simulated repository subpath. (`npm run verify:subpath`, serving `dist/` at `/ml-prep/`)
- [x] Ensure only `dist/` is uploaded. (`upload-pages-artifact` path: dist; artifact secret scan added: `scripts/scan-dist.mjs`)

Dependencies: none. Scope: medium.

### Task 2 — Calendar feasibility spike

- [x] Generate a Google Calendar URL and ICS containing `VTIMEZONE`, Toronto `DTSTART`, daily RRULE, VALARM, safe description, and stable UID. (`src/reminder/`, 23 unit tests)
- [ ] Import/test both on Android Google Calendar; record time, DST preview, URL opening, and duplicate behavior. (**BLOCKED on user device** - manual steps in `docs/calendar-spike.md`)
- [ ] Select the primary route and document delete-before-reimport behavior. (drafted in `docs/calendar-spike.md`; final selection after device check; UI warning ships in Task 15)

Dependencies: Task 1 deploy URL. Scope: small.

### Task 3a — Isolated database test harness

- [x] Run local Supabase/Inbucket or a disposable isolated project in development and CI. (local stack via `npm run supabase:start`; Mailpit at :54324; CI wiring lands with Task 5 E2E)
- [x] Provision/reset two deterministic test users without production credentials or data. (`tests/integration/helpers/testUsers.ts`, admin API on the local stack only)
- [x] Provide focused migration, RLS, RPC, race, and rollback test commands. (`npm run test:integration` via `vitest.integration.config.ts`; `npm run supabase:reset`; 6 harness tests passing)

Dependencies: Task 1. Scope: medium.

### Task 3b — Schema and ownership boundary

- [x] Add tables, practice status/completion/link fields, checks, unique constraints, composite owner foreign keys (including task→project), and Auth-user cascades. (`supabase/migrations/20260829000000_initial_schema.sql`)
- [x] Add operation-specific RLS/grants; clients can only select task events. (tasks and task_events are SELECT-only for clients; profiles updates limited to reminder columns)
- [x] Prove user B cannot read/write user A rows or attach children to user A parents. (21 integration tests in `tests/integration/ownership.test.ts` + harness)

Dependencies: Task 3a. Scope: medium.

### Task 4a — Transactional task commands

- [x] Test then implement atomic `create_custom_task` and start/complete/reopen/reschedule/skip/edit/archive transitions with exact event mapping. (`supabase/migrations/20260829010000_task_commands.sql`; security definer, fixed search_path, authenticated-only grants)
- [x] Test stale/simultaneous revisions, forced event failure rollback, forbidden direct event DML, server timestamps, command payloads, and cross-owner IDs. (23 command tests; CAS conflict returns latest row; fault-injection trigger proves rollback; simultaneous race has exactly one winner)

Dependencies: Task 3b. Scope: medium.

### Task 4b — Seed and optional-unlock commands

- [x] Bootstrap the absent profile inside `seed_plan_v1`, lock it, consume only the generated database artifact, and write version last. (`20260829030000_seed_and_unlock.sql`)
- [x] Implement irreversible `unlock_post_training` with atomic named task swap and 196-hour cap.
- [x] Test no-profile simultaneous first login, partial seed repair, rollback, repeated calls, gate rejection, and exact optional-budget swap. (9 seed/unlock tests; swap exactly 1,200 min; resolved swap tasks refuse unlock to preserve the cap)

Dependencies: Tasks 3b, 6. Scope: medium.

### Task 5 — PKCE authentication

- [x] Run E2E auth against the Task 3a isolated harness. (magic link captured from Mailpit, verify → 303 to client root `?code=`, exchange on the same client yields a session)
- [x] Pre-create the allowed account, disable signup, and use `shouldCreateUser: false`. (`[auth] enable_signup = false` locally; signUp rejected server-side; unknown email gains no account/session)
- [x] Consume root `?code=` before hash routing; test localhost and exact Pages-root redirects. (`src/auth/bootstrap.ts` consumed in `main.tsx` before rendering; unit + integration tests; redirect allowlist configured for localhost)
- [x] Verify unknown email receives generic feedback without gaining an account/session. (`AuthView` shows an identical response; no email sent, no user row, no session)

**Note:** Supabase redirect allowlist for the production Pages root is an external setup step recorded in `docs/runbook.md` (Task 17) and `tasks/plan.md` External prerequisites.

Dependencies: Tasks 1, 3a. Scope: medium.

### Task 6 — Source-to-template mapping

- [x] Create `docs/PLAN_TASK_MAPPING.md` linking every plan section/routine to stable template records. (109 tasks, 3 projects, 15 milestones, 13 gate rows; coverage checklist for every source section)
- [x] Assign exact dates from August 31–December 6, 2026; mark required vs optional and fixed deadlines. (verified against 2026 calendar: Aug 31 = Monday)
- [x] State recurrence expansion rules and expected record/minute totals by week and workstream. (8 rules; per-week/per-workstream table, arithmetic script-verified)
- [x] Reconcile unexplained differences and total exactly 196 active planned hours; map the equal theory/contingency swap used if the optional 18–22-hour Post-Training track is enabled. (11,760 min exact; 20 h swap = 12 h study + 8 h review with named keys; budget-bucket deltas documented, not silent)

Dependencies: none. Scope: medium.

### Task 7 — Template v1 and atomic seed

- [x] Encode schema-validated weeks, daily tasks, projects/gates, practice targets, and readiness gates. (`src/template/templateV1.ts` with Zod validation; 15 unit tests)
- [x] Generate frontend and database artifacts; test matching stable-key sets/content digest and inventory against the mapping manifest. (`scripts/generate-template-artifacts.mjs` → `supabase/templates/plan_v1.json` + generated migration `20260829020000`)
- [x] Prove repeat seeding is a no-op, simultaneous seeds converge, failure rolls back, incomplete seed repairs, and version writes last.

Dependencies: Tasks 4b–6. Scope: medium.

### Checkpoint A

- [ ] CI/build and Pages-subpath smoke test pass.
- [ ] Calendar and PKCE feasibility evidence is recorded.
- [ ] RLS, cross-owner, command-grant, race, and seed rollback tests pass.
- [ ] Template inventory matches the reviewed mapping manifest.

## Phase 2: daily execution

### Task 8 — Today and task completion

- [ ] Build Toronto-aware Today groups, minutes, state controls, actual-time capture, HTTPS evidence, and history.
- [ ] Route every transition through the RPC with last-seen revision.
- [ ] Show rollback/error and explicit stale-conflict refresh/retry; warn when device/server clocks differ by over five minutes.
- [ ] Verify cross-session sync; final performance measurement remains in Task 18.

Dependencies: Task 7. Scope: medium.

### Task 9 — Overdue resolution

- [ ] Derive overdue only for open tasks with current scheduled date before Toronto today.
- [ ] Require today-or-future reschedule or reasoned skip; never move work silently.
- [ ] Test Toronto midnight/DST, multiple reschedules, proactive vs late classification, dismiss/retry, and event history.

Dependencies: Task 8. Scope: small.

### Task 10 — Plan and custom-task editing

- [ ] Build 14-week date-grouped view, role/workstream/status filters, exit checks, and task history.
- [ ] Support validated custom create/edit/archive; require reason and forbid template archive.
- [ ] Keep `source_week_number` provenance from controlling grouping or metrics.

Dependencies: Tasks 8–9. Scope: medium.

### Checkpoint B

- [ ] Complete a full day and observe it in a second session.
- [ ] Two-session concurrent edit produces no lost update or orphan event.
- [ ] State-transition and overdue fixtures all pass.

## Phase 3: portfolio and interview evidence

### Task 11 — Projects and optional-track lock

- [ ] Build projects, budgets, milestones, completion gates, evidence, and blockers.
- [ ] Server rejects Post-Training unlock until both gates have qualifying evidence and user explicitly opts in.
- [ ] UI displays the time-budget tradeoff before unlock.

Dependencies: Tasks 7–8. Scope: medium.

### Task 12 — Practice and corrections

- [ ] Build coding sessions and mock sessions with normalized eight-dimension 1–5 scores.
- [ ] Define/test latest-ten predicate: completed coding only, newest completion first, excluding mocks/abandoned/missing-result records.
- [ ] Create a dated correction task with an owner-safe link to its source session.

Dependencies: Tasks 8, 10. Scope: medium.

### Task 13 — Readiness evidence

- [ ] Build distinct Data/Eval, Agent Environments, and optional Post-Training gate sets.
- [ ] Require explicit assessment plus note or HTTPS evidence for ready state.
- [ ] Keep readiness evidence-based; do not invent an automatic composite score.

Dependencies: Tasks 11–12. Scope: small.

### Task 14 — Progress metrics

- [ ] Implement original-date cohort, resolution, planned-minute attainment, actual effort, current workload, and schedule classifications.
- [ ] Create executable truth-table fixtures for all §8.4 cases and zero denominators.
- [ ] Show completed, skipped, late, rescheduled, archived, optional, and overdue distinctly with formula tooltips.

Dependencies: Tasks 8–13. Scope: medium.

### Checkpoint C

- [ ] Every mapping-manifest outcome has a visible tracking surface.
- [ ] Optional scope remains locked and excluded until enabled.
- [ ] Metric fixture outputs match expected values exactly.

## Phase 4: productization and launch

### Task 15 — Fixed reminder productization

- [ ] Implement the validated calendar path plus fallback, generic event content, and deployed Today URL.
- [ ] Keep time/timezone fixed; show not-installed/installed/verified timestamps.
- [ ] Repeat Android next-occurrence check at 5:00 PM Toronto time.

Dependencies: Tasks 2, 5. Scope: small.

### Task 16a — PWA and offline/privacy behavior

- [ ] Cache only versioned static shell assets; prove Supabase/Auth/API/personal responses are excluded.
- [ ] Block offline mutations visibly; refetch after reconnect; clear query/session state on logout.

Dependencies: Tasks 8–15. Scope: small.

### Task 16b — Responsive and accessibility hardening

- [ ] Pass 360px, Android tablet, desktop, keyboard/focus, 44px targets, contrast, and standalone-install checks.

Dependencies: Task 16a. Scope: small.

### Task 17 — Export, privacy, diagnostics, runbook

- [ ] Export all owned app data to local JSON without Auth secrets.
- [ ] Validate HTTPS links and safe external-link attributes.
- [ ] Allowlist diagnostic fields and test that user content/tokens cannot appear.
- [ ] Document Dashboard Auth-user deletion/cascade, outage/auth/deploy recovery, and restore limits.
- [ ] Scan repository and built artifact for secrets/private plan data.

Dependencies: Tasks 3b–16b. Scope: medium.

### Task 18 — Production acceptance

- [ ] Deploy from public GitHub repository; all CI checks pass.
- [ ] Test Linux Chromium/Firefox, Android phone/tablet, PWA install, calendar, PKCE, and two-device synchronization.
- [ ] Exercise complete, reopen, overdue reschedule, skip, practice correction, readiness evidence, stale conflict, export, logout/cache clearing, and error recovery.
- [ ] Record 20-trial Today performance evidence and final acceptance results.

Dependencies: Tasks 1–17. Scope: acceptance gate.

## Final gate

- [ ] Every spec MVP item maps to a completed task and evidence.
- [ ] No privileged secret or private progress is present in the public repository/artifact.
- [ ] RLS/RPC isolation, atomicity, metrics, reminder, and physical-device acceptance all pass.
