<!--
Synchronized copy - edit the source, not this file.
Source: /home/ivlr/Study/Job Search/cohere/docs/WEBAPP_SPEC.md
Synchronized: 2026-08-29
Re-sync procedure: copy the source over this file and update this date.
-->

# Product specification: Cohere Preparation Tracker

Status: Implementation-ready draft  
Owner/user: Mohammed Saidul Islam  
Source plan: `COHERE_MTS_PREPARATION_PLAN.md`  
Target deployment: GitHub Pages from a public GitHub Free repository  
Default timezone: `America/Toronto`  
Daily reminder: 5:00 PM local Toronto time

## 1. Product summary

Cohere Preparation Tracker is a private, single-user progress application for executing the 14-week Cohere MTS preparation plan. It converts the markdown plan into dated daily tasks, project milestones, practice records, and role-specific readiness gates.

The frontend is a static single-page application hosted publicly on GitHub Pages. Authentication and personal progress are stored privately in Supabase. The application code and non-personal plan template may be public; no user progress, email address, notes, or credentials may be stored in the repository or deployed bundle.

The application should make the next useful action obvious in under five seconds:

1. Open the app.
2. See today's work and unresolved overdue work.
3. Complete, skip, or explicitly reschedule tasks.
4. See whether progress is sufficient for each target role.

## 2. Confirmed product decisions

| Decision               | Selection                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| GitHub account         | GitHub Free                                                                                   |
| Repository             | Public, because private-repository Pages is not available on GitHub Free                      |
| Site type              | Static React/TypeScript single-page application                                               |
| Primary devices        | Linux desktop, Android phone, Android tablet                                                  |
| Cross-device storage   | Supabase Auth + Postgres with row-level security                                              |
| Authentication         | Pre-invited Supabase user + email magic link with automatic user creation disabled            |
| Reminder channel       | Google Calendar recurring event, with `.ics` fallback                                         |
| Reminder schedule      | Daily at 5:00 PM in `America/Toronto`, including DST transitions                              |
| Incomplete tasks       | Remain overdue until individually rescheduled or skipped                                      |
| Offline support        | Installable PWA with static shell caching only; personal data and writes require a connection |
| Optional notifications | Dynamic email/web push deferred beyond MVP                                                    |

## 3. Goals

- Turn the 14-week plan into an actionable daily schedule.
- Synchronize task state across Linux and Android devices.
- Make overdue work impossible to lose through silent automatic rollover.
- Track effort and evidence, not only checkbox completion.
- Expose readiness separately for Data/Eval, Agentic Environments, and optional Post-Training.
- Keep setup and maintenance low enough for one person.
- Deploy automatically to GitHub Pages after changes pass checks.

## 4. Non-goals

- A general-purpose project-management system.
- Multi-user collaboration, managers, or social features.
- AI-generated coaching or automatic interview scoring in MVP.
- Server-generated push notifications in MVP.
- Perfect offline editing/conflict resolution.
- Storing CV files, employer-confidential artifacts, API keys, or private experiment data.
- Replacing a calendar; the app creates the reminder and owns preparation state.

## 5. Success criteria

The MVP succeeds when:

- The user can sign in on Linux and Android and see the same task state.
- The complete preparation template is seeded exactly once for the user.
- Today's tasks are visible immediately after sign-in.
- Every incomplete past-due task requires an explicit `Reschedule` or `Skip` decision.
- Task completion, actual minutes, and evidence notes persist across devices.
- Project milestones, interview practice, and readiness gates are trackable.
- A Google Calendar event or `.ics` event reminds the user daily at 5:00 PM Toronto time and opens the deployed app.
- The site is usable at 360 px width and with keyboard-only navigation.
- A public repository and deployed bundle contain no private progress or privileged secret.

## 6. Information architecture

The app is one SPA deployment with hash-based views so direct navigation works on GitHub Pages without server rewrites.

### 6.1 Authentication view

- Product name and concise privacy explanation.
- Email magic-link form using `shouldCreateUser: false`.
- Generic success response to avoid disclosing whether an address is allowed.
- Sign-out control available after authentication.

### 6.2 Today — default view

Top section:

- Current date in Toronto time.
- Current plan week and phase.
- Today's planned minutes, completed minutes, and task count.
- Role focus tags for today's work.

Overdue resolution queue:

- Appears before today's list when unresolved overdue tasks exist.
- Shows one task at a time with original date, estimate, category, and accumulated reschedule count.
- Actions: `Tomorrow`, `Choose date`, or `Skip`.
- Skip requires a short reason from a configurable list plus optional note.
- Rescheduling records an event; it never overwrites original scheduling history.
- The queue can be dismissed for the session, but overdue tasks remain visible and unresolved.

Today's task list:

- Group by `Deep work`, `Practice`, `Application`, and `Review`.
- Task card shows title, estimate, role tags, project/week relationship, and acceptance note.
- States: `Not started`, `In progress`, `Completed`, `Skipped`, `Overdue`.
- Task actions: start, complete, edit actual minutes, add evidence URL/note, reschedule, or skip.
- Completing a task records completion time and positive actual minutes (prefilled from the estimate); evidence remains optional.
- A completed task can be reopened with an audit event.

End-of-day check-in:

- Available after 5:00 PM or on demand.
- Displays planned vs completed time and unresolved work.
- Captures one short learning and the next day's highest-risk gap.
- Does not require journaling to mark tasks complete.

### 6.3 Plan view

- Fourteen collapsible week sections with date ranges and exit checks.
- Weekly progress based on task state and minutes.
- Filters: role, category, project, state, and date.
- Create, edit, archive, and reschedule custom tasks through audited database commands.
- Template tasks retain a source identifier so template upgrades do not duplicate them.
- Exit checks appear as explicit tasks or readiness items, not passive prose.
- Original plan prose remains accessible through a link/reference, not copied into every task.

### 6.4 Projects view

Project cards:

1. EvalOps for tool-using enterprise agents.
2. Distributed training and rollout reliability lab.
3. Verifier-guided post-training mini-lab (optional and initially locked).

Each project shows:

- Purpose and target-role relevance.
- Time budget and actual logged minutes.
- Milestones with acceptance criteria.
- Completion gate checklist.
- Evidence links: repository, design document, report, demo, results.
- Blocked/at-risk status and a short blocker note.

Project 3 unlock condition:

- Projects 1 and 2 completion gates pass.
- The user explicitly enables Post-Training as a target.
- The application warns that enabling it consumes contingency/theory hours.

### 6.5 Practice view

Coding practice:

- Date, topic, difficulty/type, allotted time, elapsed time, result, mistake category, correction date, and notes/link.
- Weekly target: two reviewed sessions through Week 10, then mocks.
- Readiness calculation uses the latest ten qualifying tasks, not lifetime volume.

Mock interviews:

- Type: coding, evaluation/statistics, ML fundamentals, system design, research deep dive, or behavioral.
- Duration, interviewer/self-recorded, evidence URL, and free-text feedback.
- Scores from 1–5 for the eight rubric dimensions in the preparation plan.
- Required correction task can be created directly from a low score.

### 6.6 Readiness view

Role cards for:

- Data Analysis and Evaluation.
- Agentic Environments.
- Post-Training, labeled optional.

Each role shows only applicable gates and one of:

- `Not assessed`
- `In progress`
- `Ready`
- `At risk`

Gates are evidence-based checklists, not automatically inferred confidence scores. The app may suggest a status from underlying metrics, but the user must explicitly mark a gate passed and attach a note or evidence link.

### 6.7 Progress view

Show useful signals without encouraging checkbox gaming:

- Planned vs completed minutes for the current and previous week.
- Task outcome counts: completed on time, completed late, skipped, rescheduled, and unresolved overdue.
- Fourteen-week completion trend.
- Project milestone progress.
- Practice volume and latest-ten coding readiness.
- Mock rubric trend by dimension.
- Readiness gate matrix by target role.
- Consistency: days with at least one planned task completed, shown as context rather than a punitive streak.

### 6.8 Settings view

- Account email and sign out.
- Timezone displayed as fixed `America/Toronto` in MVP.
- Daily reminder displayed as fixed at 5:00 PM, with installation/verification status.
- `Add to Google Calendar` and `Download .ics` controls.
- Canonical plan window displayed as August 31–December 6, 2026; dates are not globally movable in MVP.
- Enable the optional Post-Training track after gates pass. Enablement is one-way in MVP; disabling after evidence/work exists is deferred.
- Export all personal data as JSON.
- Export data and open documented account-deletion instructions. Deletion itself is performed from the Supabase Dashboard so the browser never receives admin authority.

## 7. Core workflows

### 7.1 First use

1. Owner invites the user's email once from the Supabase Dashboard and disables automatic/public signup.
2. User enters the pre-created email in the app.
3. User follows the magic link.
4. App calls the transactional `seed_plan_v1()` database RPC. The RPC locks the profile, repairs any incomplete v1 seed idempotently, and writes `template_version = 1` only after every required row succeeds.
5. User confirms the fixed Toronto timezone and canonical plan dates.
6. App offers the calendar reminder setup.
7. App opens Today.

Returning users with a completed template version are never reseeded automatically. An incomplete/failed seed exposes a repair action that safely reruns the same transactional RPC.

### 7.2 Complete a task

1. User opens a task.
2. User optionally marks it in progress.
3. User marks it complete and records actual minutes, either accepting the estimate or entering a value.
4. User optionally attaches a URL and concise evidence note.
5. App calls one transactional task-transition RPC with the last-seen revision. The server validates the transition, locks/updates the task, increments its revision, inserts the server-timestamped immutable event, and returns the new row.

### 7.3 Resolve overdue work

1. App identifies tasks whose scheduled local date is before today and whose state is incomplete.
2. User chooses tomorrow, a today-or-future date, or skip for each task.
3. Reschedule uses the transactional transition RPC to create a history event containing old/new dates and optional reason.
4. Skip uses the same RPC, requires a reason, and excludes the task from completion credit.
5. No background process silently moves the task.

### 7.4 Daily reminder

1. User adds a recurring calendar event once.
2. The event occurs daily at 5:00 PM `America/Toronto` and survives daylight-saving changes.
3. Notification text contains no private task details: “Cohere preparation: review and complete today's tasks.”
4. Event URL opens the deployed Today view.
5. The reminder fires regardless of task completion; completion-aware reminders are deferred.

## 8. Task and progress rules

### 8.1 Task resolution and schedule definitions

Resolution and timeliness are separate dimensions so every task has an unambiguous classification.

Resolution:

- `Open`: not started or in progress.
- `Completed`: latest valid state is completed.
- `Skipped`: explicitly resolved without completion and with a reason.
- `Archived`: custom task explicitly removed from active planning with a reason. Template tasks cannot be archived; they must be completed, skipped, or rescheduled.

Schedule classification for completed tasks:

- `Completed on original schedule`: completed by 11:59:59 PM Toronto time on `original_scheduled_date`, determined from server timestamps and schedule history without any missed deadline.
- `Completed after proactive reschedule`: rescheduled before becoming overdue and completed by the then-current scheduled deadline.
- `Completed late`: completed after any scheduled deadline had already passed.

Other schedule flags:

- `Rescheduled`: at least one reschedule event exists; history always preserves old/new dates.
- `Overdue`: current `scheduled_date` is before today and resolution is open. Completed, skipped, and archived tasks are never overdue.

### 8.2 Metrics

- Original-schedule cohort is fixed by `original_scheduled_date`; rescheduling never moves a task into or out of that cohort.
- Cohort eligibility freezes when a task first becomes due. Later skip, archive, reschedule, or optional-track changes never remove it from that historical denominator.
- On-time completion rate = tasks completed on original schedule / eligible template and custom tasks originally due in the period.
- Resolution rate = tasks completed or skipped / eligible tasks originally due in the period, with completed, skipped, and archived shown separately. Archived is a non-completion and never enters the numerator.
- Planned-minute attainment = estimated minutes of tasks completed / estimated minutes of eligible tasks originally due in the period.
- Actual effort = actual minutes grouped by completion/practice date, not due date.
- Current workload shows open estimated minutes grouped by current `scheduled_date`; it is not labeled plan completion.
- Skipped tasks never count as completed.
- Rescheduled tasks remain in their original schedule-fidelity cohort.
- Optional/project tasks are excluded until enabled.
- Reopened tasks immediately stop contributing completion credit until completed again.
- A zero denominator displays `—` rather than 0% or 100%.

These formulas must be documented in UI tooltips and covered by unit tests.

### 8.3 State transition contract

| From                 | Allowed next state                    | Required fields/rules                                                             |
| -------------------- | ------------------------------------- | --------------------------------------------------------------------------------- |
| `not_started`        | `in_progress`, `completed`, `skipped` | Completion requires positive actual minutes; skip requires a reason.              |
| `in_progress`        | `completed`, `skipped`, `not_started` | Same completion/skip requirements.                                                |
| `completed`          | `in_progress`, `not_started`          | Reopen clears `completed_at` and removes completion credit but preserves history. |
| `skipped`            | `not_started`                         | Reopen clears the active skip reason but preserves its event.                     |
| any open custom task | `archived`                            | Requires an archive reason. Template tasks cannot be archived.                    |

Reschedule is an orthogonal transition allowed only for open tasks. Its destination must be today or later in Toronto time. Server time determines event ordering and deadline comparisons. If device time differs from server time by more than five minutes, the UI warns the user.

### 8.4 Metric fixture contract

Automated fixtures must cover: completion before/on/after the original deadline; proactive and overdue reschedules; multiple reschedules; skip; reopen; custom archive retained as a denominator/non-completion; optional tasks before/after enablement; zero denominators; and a task completed in one reporting period but originally due in another. The fixture table and expected values are the executable truth source for metric behavior.

## 9. Reminder specification

Reminder time and timezone are fixed in MVP at 5:00 PM `America/Toronto`. The app shows `not installed`, `installed`, or `verified on device`, with timestamps. Changing reminder time/timezone is deferred because an imported calendar event cannot be reliably edited by this static app.

### 9.1 Google Calendar link

Generate a prefilled Google Calendar creation URL containing:

- Title: `Cohere preparation check-in`
- Start: 5:00 PM in `America/Toronto`
- Duration: 15 minutes
- Recurrence: daily
- Description: concise prompt plus deployed Today URL
- No task titles, progress, email, or other private state

Because Google Calendar URL behavior may differ across clients, retain `.ics` as the canonical fallback and document one manual verification on Android.

### 9.2 ICS file

Generate standards-compatible calendar text with:

- `DTSTART;TZID=America/Toronto`
- A standards-compatible `VTIMEZONE` definition for `America/Toronto`
- `RRULE:FREQ=DAILY`
- Fifteen-minute duration/end
- `VALARM` at event start or the most consistently supported non-negative setting established during implementation testing
- Stable UID for event identity; the UI still warns that Google Calendar may create a duplicate and instructs the user to delete the old event before re-importing
- Deployed application URL

Acceptance requires importing the event into the user's Google Calendar and verifying the next occurrence on Android at 5:00 PM Toronto time.

## 10. Data model

All tables use UUID primary keys, `created_at`, and `updated_at`. Every child carries `user_id`, and composite foreign keys such as `(task_id, user_id) -> tasks(id, user_id)` prevent cross-owner references. Parent tables therefore have `unique (id, user_id)`.

### 10.1 `profiles`

- `user_id` UUID, primary/foreign key to auth user
- `timezone` text, fixed `America/Toronto` in MVP
- `reminder_local_time` time, fixed `17:00` in MVP
- `reminder_installed_at`, `reminder_verified_at` nullable timestamps
- `post_training_enabled` boolean
- `template_version` integer nullable until a seed transaction succeeds

### 10.2 `plan_weeks`

- `id`, `user_id`
- `week_number` 1–14
- `title`, `start_date`, `end_date`
- `phase`, `exit_check`
- unique `(user_id, week_number)`

### 10.3 `tasks`

- `id`, `user_id`, `source_week_number` nullable provenance only
- `template_task_key` nullable text with `unique (user_id, template_task_key)`; null remains available for custom tasks
- `title`, `description`, `acceptance_note`
- `category`: deep_work, practice, application, review
- `role_tags` text array
- `project_id` nullable UUID with composite `(project_id, user_id)` owner foreign key
- `original_scheduled_date`, `scheduled_date`
- `estimated_minutes`, `actual_minutes`
- `revision` non-negative integer, incremented on every mutation
- `state`: not_started, in_progress, completed, skipped, archived
- `completed_at`, `skip_reason`, `evidence_url`, `evidence_note`
- `source_practice_session_id` nullable with composite owner foreign key

Overdue and reschedule count are derived from date/state/event history rather than stored. Plan grouping and metrics use dates, never `source_week_number`. Checks enforce state-dependent fields and positive minute values.

### 10.4 `task_events`

- `id`, `user_id`, `task_id` with composite owner foreign key
- `event_type`: created, started, completed, reopened, rescheduled, skipped, edited, archived
- `occurred_at`
- `from_scheduled_date`, `to_scheduled_date`
- `metadata` JSONB for reason or safe change details

Clients receive select-only access to events. Inserts occur only inside approved server RPCs; update and delete are revoked.

### 10.5 `projects` and `project_milestones`

Projects:

- `id`, `user_id`, `project_key`, `name`, `target_roles`, `budget_minutes`
- `state`: locked, active, completed, at_risk
- `repository_url`, `design_url`, `report_url`, `demo_url`, `blocker_note`

Milestones:

- `id`, `user_id`, `project_id`, `title`, `acceptance_criteria`
- `target_date`, `completed_at`, `evidence_url`, `sort_order`, `is_completion_gate`

### 10.6 `practice_sessions`

- `id`, `user_id`, `session_type`, `date`, `state`, `completed_at`
- `topic`, `allotted_minutes`, `elapsed_minutes`, `result`
- `mistake_category`, `correction_due_date`, `corrected_at`
- `notes`, `evidence_url`

### 10.7 `mock_scores`

- `id`, `user_id`, `practice_session_id` with composite owner foreign key
- `dimension_key` constrained to the eight canonical rubric dimensions
- `score` integer 1–5
- unique `(practice_session_id, dimension_key)`

### 10.8 `readiness_gates`

- `id`, `user_id`, `role_key`, `gate_key`, `title`
- `state`: not_assessed, in_progress, ready, at_risk
- `evidence_note`, `evidence_url`, `assessed_at`
- unique `(user_id, role_key, gate_key)`

### 10.9 `daily_checkins`

- `id`, `user_id`, `local_date`
- `learning`, `highest_risk_gap`
- unique `(user_id, local_date)`

### 10.10 Database command boundary

The following operations are transactional Postgres functions:

- `seed_plan_v1()`: inserts the authenticated user's profile with `on conflict do nothing`, then locks it, repairs an incomplete seed idempotently, creates all version-1 records from a build-generated/version-controlled database artifact, and writes `template_version = 1` last. No client-supplied seed payload is trusted.
- `create_custom_task(payload)`: validates ownership/date/fields, inserts the task at revision 0, and appends its `created` event atomically.
- `transition_task(task_id, expected_revision, transition, payload)`: supports start, complete, reopen, reschedule, skip, edit, and archive; checks `auth.uid()`, locks the task, validates command-specific state/date/fields, updates it, increments `revision`, appends the matching server-timestamped event, and returns the row. A revision conflict returns the latest row for an explicit refresh/retry UI.
- `unlock_post_training()`: validates the required completion-gate evidence and explicit opt-in in one transaction.

These functions are `security definer` only where required, use a fixed/empty `search_path` and fully qualified names, validate `auth.uid()`, revoke execution from `public` and `anon`, and grant only to `authenticated`. Direct client DML that could bypass a command is revoked. Ordinary table access has operation-specific RLS policies, not blanket CRUD policies.

## 11. Template ingestion

- Create `docs/PLAN_TASK_MAPPING.md` as a reviewable source-to-template coverage manifest. Generate both a schema-validated TypeScript/JSON template for display/testing and a deterministic SQL/JSON database artifact consumed by `seed_plan_v1()`; CI proves both share the same stable keys and content digest.
- Template includes 14 weeks, daily tasks, projects, milestones, practice targets, and readiness gates.
- Every template task has a stable key independent of its database UUID.
- The schedule is canonical and fixed from August 31 through December 6, 2026. Weekly routine rules generate concrete daily tasks; fixed interview/application deadlines never shift. The manifest records expected counts and planned minutes by week/workstream and reconciles to the 196-hour budget.
- Optional Post-Training tasks are preseeded disabled. Enabling them activates 18–22 hours and deactivates an explicitly mapped equal allocation from theory/contingency; it must never raise the active plan above 196 hours. The unlock RPC performs this swap atomically and records the affected task keys. Enablement is intentionally irreversible in MVP.
- Initial seeding is one atomic, idempotent transaction safe under simultaneous first login on two devices. A forced-failure test proves rollback; an incomplete prior seed is repaired.
- Version 1 is the MVP boundary; future template migration behavior is deliberately unspecified.
- The markdown file remains the narrative source; the template is the executable schedule source.

## 12. Architecture

### 12.1 Frontend

- React + TypeScript + Vite.
- Hash-based application routing compatible with GitHub Pages project paths. Supabase Auth uses PKCE: the root page consumes the `?code=` callback query before the hash router starts, then removes the code from history and enters the app.
- Supabase JavaScript client for auth/data.
- TanStack Query or an equivalently small query/cache layer.
- Zod validation at template, form, and database boundaries.
- CSS custom properties and component styles; avoid a large design-system dependency for MVP.
- PWA manifest and service worker for installability and cached application shell.
- Simple SVG/CSS charts; avoid adding a chart library unless it materially reduces code.

### 12.2 Backend services

- Supabase hosted Auth and Postgres only for MVP.
- No custom always-on server.
- No Supabase service-role key in frontend, repository, GitHub variables, or build output.
- Client uses only the publishable/anonymous key; RLS plus the database command boundary is the security boundary.

### 12.3 Deployment

- Public GitHub repository under GitHub Free.
- GitHub Actions runs typecheck, lint, unit tests, production build, and deploys the artifact to Pages.
- Vite `base` is configured for the repository subpath.
- Supabase allowed redirect URLs include the exact production Pages root and approved localhost development roots used by PKCE.
- Public Supabase URL/publishable key may be build variables; document that they are identifiers, not authorization secrets.

## 13. Authentication and privacy

- Create/invite the sole user from the Supabase Dashboard, disable public signup, and call `signInWithOtp` with `shouldCreateUser: false`. Client-side email comparison is not an access control.
- Each personal table has only the operation-specific RLS policies and grants its UI requires. Child writes must also satisfy composite owner foreign keys.
- Automated integration tests use two users provisioned in an isolated local Supabase stack or disposable test project, never production.
- The frontend must never query another user's rows, even if a guessed UUID is supplied.
- Evidence URLs/notes may contain sensitive context and must remain in protected storage. URLs must use `https:`; external links use `rel="noopener noreferrer"`.
- Calendar event content contains no private progress.
- Logs and analytics must not contain email, task notes, evidence URLs, or tokens.
- MVP includes no third-party analytics.
- Export produces a local JSON download. MVP has no self-service deletion button: the operator deletes the Auth user in the Supabase Dashboard, and `on delete cascade` removes owned application rows. No admin/secret key is exposed to the browser.

## 14. Cross-device and offline behavior

- Server data is authoritative.
- Mutations use optimistic UI only when rollback/error state is visible.
- Task mutations use revision compare-and-swap. A stale revision returns the latest server row and requires explicit refresh/retry; the client never silently overwrites it.
- The app refetches on focus and after reconnecting.
- PWA caches only versioned static shell assets. Service-worker rules never cache Supabase, Auth, API, query, HTML containing user state, or other personal responses.
- Sign-out clears the query cache, session-scoped state, and any non-sensitive local UI preferences that could reveal activity.
- Offline mode is visibly read-only in MVP; no task mutation appears successful while disconnected.

## 15. UX and visual requirements

- Mobile-first design tested at 360 × 800, common Android tablet width, and Linux desktop width.
- Bottom navigation on narrow screens; side navigation on wide screens.
- Today remains one tap from every view.
- Minimum 44 × 44 px interactive targets.
- Visible focus states, semantic landmarks, associated labels, and no color-only status.
- WCAG 2.1 AA contrast target.
- Light and dark themes follow system preference; manual override is optional.
- Loading skeletons must not shift primary controls unexpectedly.
- Empty, error, offline, and first-use states are explicitly designed.
- Dates always display with a timezone-aware local date; avoid bare UTC conversion in UI logic.

## 16. Error handling

- Authentication errors use actionable, non-sensitive messages.
- Failed mutations remain visible with retry; no false success toast.
- Seeding failures are retryable and idempotent.
- Invalid template data blocks deployment tests rather than failing at runtime.
- Calendar generation validates required fields before download.
- Supabase unavailability shows cached/read-only state where available.
- A global error boundary offers reload and an allowlisted diagnostic copy containing only app version, route, error code/class, browser family, and timestamp—never free-form messages, URLs, user content, email, or tokens.

## 17. Testing requirements

### Unit tests

- Toronto local-date and DST behavior.
- Overdue derivation and the complete state-transition matrix.
- Metric truth-table fixtures, including zero denominators and reopen/reschedule/archive/optional cases.
- Optional-track inclusion/exclusion.
- Template schema and stable-key uniqueness.
- ICS content, `VTIMEZONE`, recurrence, stable UID, and URL escaping.
- The “latest ten qualifying coding tasks” predicate: completed coding sessions, ordered by completion timestamp descending, excluding mocks, skipped/abandoned sessions, and sessions without a recorded result.

### Component tests

- Today list states and completion form.
- Blocking/prominent overdue resolution queue.
- Project 3 lock/unlock behavior.
- Readiness gate evidence requirement.
- Offline and mutation-error feedback.

### Integration tests

- Starting with no profile row, first login bootstraps the profile and seeds exactly once; forced failure rolls back all rows and simultaneous first logins converge to one complete seed.
- Second device/session sees completed task.
- One user cannot read, mutate, or create child references to another user's rows.
- Custom creation and every task transition map to exactly one event atomically; stale and simultaneous revisions have deterministic conflict behavior.
- Direct event insert/update/delete is rejected; rescheduling preserves event history.
- Frontend and database seed artifacts have matching stable-key sets/content digest.
- Post-Training unlock is rejected until every server-checked gate passes.
- Account export includes all owned data and no auth secret.

### End-to-end tests

- PKCE sign-in callback at the Pages root works before hash routing. CI uses local Supabase with Inbucket or a disposable test project/test-only auth helper isolated from production.
- Complete today's task and observe dashboard update.
- Resolve an overdue task through both reschedule and skip flows.
- Record a practice session and readiness evidence.
- Production build works under a GitHub Pages repository subpath.
- Service-worker tests prove Supabase/Auth/API/personal responses are never cached and logout clears client state.

### Manual acceptance

- Linux Chromium/Firefox responsive check.
- Android Chrome phone and tablet check.
- Add PWA to Android Home Screen.
- Import calendar reminder into Google Calendar and verify a 5:00 PM Toronto occurrence.
- Sign in on two physical devices and confirm synchronization.
- Confirm stale-update conflict UX using two simultaneous sessions.

## 18. Observability and maintenance

- Display application version/commit SHA in Settings.
- Capture non-sensitive frontend errors locally with a copy-to-clipboard diagnostic; hosted error tracking is deferred.
- Database migrations live in version control.
- Dependabot and normal dependency update workflow may be enabled.
- Data export remains always available.
- A short operator runbook covers Supabase outage, auth redirect error, failed deployment, and data restore limitations.

## 19. MVP release boundary

MVP includes:

- Authentication and protected cross-device data.
- Versioned preparation-plan seed.
- Today, Plan, Projects, Practice, Readiness, Progress, and Settings views.
- Explicit overdue reschedule/skip flow.
- Project milestones and readiness evidence.
- Fixed calendar reminder at 5:00 PM Toronto time with installed/verified status.
- PWA installability and read-only offline indication.
- Export, responsive design, core tests, and GitHub Pages deployment.

MVP excludes:

- Dynamic completion-aware email or web-push reminders.
- AI recommendations or automatic scoring.
- Rich text editing and file uploads.
- Multi-user/team support.
- Full offline mutations.

## 20. Future enhancements

Only consider after four weeks of real usage:

- Supabase scheduled function sending an email only when tasks remain incomplete at 5:00 PM.
- Web Push for installed Android PWA.
- GitHub contribution/repository evidence integration through a server-side token flow.
- Calendar task-specific scheduling.
- Automated weekly review summary.
- Plan-template migration UI.

## 21. Phase-1 feasibility gates

- Before reminder UI work, test the Google Calendar recurrence URL and standards-complete `.ics` import on the user's Android phone. Record which route works and the duplicate-event behavior.
- Before feature work, verify that the pre-invited user receives PKCE magic links, an unknown email is not created with `shouldCreateUser: false`, and the exact Pages-root callback works before hash routing.
- A short two-GPU Project 2 run is an external preparation-plan dependency and does not block this tracker.

## 22. Definition of done

The application is done when every MVP item is implemented, automated checks pass, the Pages deployment succeeds from the public repository, RLS/RPC isolation is verified, the reminder works on Android at 5:00 PM Toronto time, and the user completes one full daily workflow on both Linux and Android without consulting developer instructions. On an authenticated warm load over stable broadband, the Today view's first useful interactive state must be at or below 2.5 seconds in 20 recorded trials, with p95 reported.
