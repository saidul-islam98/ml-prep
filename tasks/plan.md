<!--
Synchronized copy - edit the source, not this file.
Source: /home/ivlr/Study/Job Search/cohere/tasks/plan.md
Synchronized: 2026-08-29
Re-sync procedure: copy the source over this file and update this date.
-->

# Implementation plan: Cohere Preparation Tracker

## Outcome

Build the tracker in `docs/WEBAPP_SPEC.md` as a React/TypeScript PWA on public GitHub Pages with private Supabase data. Ship in small, testable slices; resolve auth and calendar feasibility before building dependent UI.

## Fixed decisions

- Canonical plan dates: August 31–December 6, 2026; no movable global start date.
- Fixed daily reminder: 5:00 PM `America/Toronto`.
- PKCE callback is consumed at the Pages root before hash routing.
- Supabase is authoritative. Offline caches static shell assets only and permits no mutations.
- Task transitions/event writes and plan seeding are atomic RPCs with server timestamps.
- Post-Training is optional and server-locked behind the specified completion gates.
- Self-service app deletion is out of MVP; operator deletion of the Auth user cascades app data.

## Dependency graph

```text
1 scaffold ─┬─ 2 calendar spike
            ├─ 3a local DB harness → 3b schema/RLS → 4a task commands
            └─ 5 PKCE auth ─────────────────────────────────────────┐
6 mapping (independent) ───────────────┬─ 4b seed/unlock commands → 7 template seed
                                      └──────────────────────────────┐
8 Today → 9 overdue → 10 Plan ──────────────────────────────────────┤
7 seed → 11 Projects → 12 Practice → 13 Readiness → 14 Progress ───┤
2 calendar spike → 15 reminder UI                                  │
8–15 → 16 PWA/accessibility → 17 export/security/runbook → 18 launch
```

## Ordered tasks

### Phase 1: eliminate architecture risk

1. Scaffold Vite/React/TypeScript, tests, CI, hash navigation, and Pages-subpath build.
2. Spike Google Calendar URL and standards-complete ICS on Android; record chosen path and duplicate behavior.
   3a. Establish isolated local Supabase/Inbucket integration-test infrastructure.
   3b. Add relational schema, constraints, composite ownership keys, cascades, least-privilege RLS, and two-user tests.
   4a. Add complete custom-create/task-transition commands, revision conflicts, grants, event atomicity, and race/rollback tests.
   4b. Add profile-bootstrap/seed and irreversible optional-unlock commands with concurrency/rollback tests.
3. Add PKCE auth callback before routing and E2E auth tests on the isolated harness.
4. Write `docs/PLAN_TASK_MAPPING.md`; reconcile every source item, date, count, and minute to 196 hours.
5. Encode matching frontend/database template-v1 artifacts and prove atomic/idempotent/concurrent seeding.

### Checkpoint A

- CI build works at a Pages subpath.
- Android reminder feasibility and PKCE redirect are proven.
- Two-user RLS and cross-owner reference tests pass.
- Forced and concurrent seed tests pass.
- Mapping manifest has no unexplained source-plan gaps.

### Phase 2: daily execution

8. Build Today and atomic start/complete/reopen/evidence flows with conflict UI.
9. Build explicit overdue reschedule/skip queue with server-time/date handling.
10. Build 14-week Plan, filters, custom-task editing/archive, and history.

### Checkpoint B

- One daily workflow synchronizes across two sessions.
- Simultaneous edits produce a visible conflict, not data loss.
- Every state transition and metric fixture passes.

### Phase 3: portfolio and interview evidence

11. Build Projects/milestones and server-enforced optional Post-Training unlock.
12. Build coding/mock practice, normalized rubric scores, and linked correction tasks.
13. Build role-specific readiness gates with evidence.
14. Build progress metrics from fixed cohorts and the executable truth table.

### Checkpoint C

- Every required preparation-plan outcome has a trackable home.
- Data/Eval and Agent Environments remain distinct.
- Post-Training cannot unlock through direct client manipulation.
- Metrics never reward skipping or schedule movement as completion.

### Phase 4: productization and launch

15. Productize the validated fixed reminder with installed/verified status.
    16a. Add static-shell PWA, offline indication, logout clearing, and negative cache tests.
    16b. Add responsive layouts and accessibility acceptance.
16. Add JSON export, HTTPS URL validation, safe diagnostics, deletion runbook, and secret/build scan.
17. Deploy production and complete Linux, Android phone/tablet, two-device, performance, and calendar acceptance.

## External prerequisites

- Public GitHub repository with Pages and Actions enabled.
- Supabase project for production; local Supabase/Docker or a disposable test project for integration tests.
- Sole user pre-created/invited; public signup disabled.
- Exact production and localhost PKCE redirect roots configured.
- Android phone available during Tasks 2, 16, and 18.

## Risk controls

| Risk                                            | Control                                                                              |
| ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| Public bundle exposes private data or admin key | RLS/RPC boundary, publishable key only, artifact/secret scan                         |
| Cross-device races corrupt task/event history   | Row lock + expected revision + single transaction                                    |
| First-login interruption creates partial plan   | Profile lock, one seed transaction, version written last, rollback/concurrency tests |
| Calendar reminder shifts/duplicates             | Phase-1 Android spike, VTIMEZONE, explicit delete-before-reimport guidance           |
| Metrics overstate readiness                     | Fixed original-date cohorts and executable edge-case truth table                     |
| Service worker leaks personal responses         | Static assets only; negative cache tests for Supabase/Auth/API                       |
| Scope becomes a generic planner                 | Fixed dates/reminder and explicit MVP exclusions                                     |

Execution details and acceptance checks are in `tasks/todo.md`.
