# Cohere Preparation Tracker UI Redesign Checklist

Plan: `tasks/ui-redesign-plan.md`  
Functional specification: `docs/WEBAPP_SPEC.md`  
Desktop baseline screenshots: `../trash-ui/`

Every task preserves existing data/API behavior and leaves its focused tests green.

## Task UI-1: Capture the redesign contract and visual baseline

**Description:** Turn the screenshot/source audit into a concrete visual acceptance baseline before changing components. Record the target layouts for desktop, tablet, and phone, including light and dark themes.

**Acceptance criteria:**

- [x] Record annotated findings for all seven existing screenshots and capture missing 360px, tablet, and light-theme baselines.
- [x] Define page wireframes for the shell, Today, task card, Plan, Projects, Practice, Readiness, Progress, and Settings.
- [x] Document the approved navigation and task-action hierarchy without changing application behavior.

**Verification:**

- [ ] Manual check: every existing route and required workflow appears in the wireframes.
- [ ] Manual check: user approves the visual direction before implementation continues.

**Dependencies:** None  
**Files likely touched:** `docs/UI_REDESIGN.md`, `docs/ui-baseline/**`  
**Estimated scope:** Small

## Task UI-2: Introduce semantic tokens and shared UI primitives

**Description:** Replace the current small generic token set with a deliberate light/dark design system and reusable primitives that future page slices consume.

**Acceptance criteria:**

- [x] Define complete color, typography, spacing, radius, elevation, role, status, and motion tokens; remove undefined tokens such as `--space-5`.
- [x] Add shared Button, IconButton, Badge, Card, ProgressBar, PageHeader, EmptyState, and disclosure/menu primitives with consistent variants.
- [x] All primitives meet focus, contrast, reduced-motion, disabled, loading, and 44px-target requirements.

**Verification:**

- [ ] Tests pass: focused primitive rendering/keyboard tests.
- [ ] Tests pass: `npm run typecheck && npm run lint`.
- [ ] Manual check: primitive gallery in light/dark and at 360px.

**Dependencies:** UI-1  
**Files likely touched:** `src/styles/tokens.css`, `src/styles/primitives.css`, `src/components/ui.tsx`, `tests/unit/uiPrimitives.test.tsx`  
**Estimated scope:** Medium

## Task UI-3: Rebuild responsive application navigation

**Description:** Use the new primitives to create a useful desktop sidebar, mobile top bar, five-item mobile bottom navigation, and accessible More menu.

**Acceptance criteria:**

- [x] Desktop sidebar shows product identity, current-week context, all seven routes, active state, and connectivity/account context without wasting the content canvas.
- [x] Mobile bottom navigation exposes Today, Plan, Projects, Practice, and More; More gives keyboard/screen-reader access to Readiness, Progress, and Settings.
- [x] Main content uses responsive page widths and does not hide behind fixed navigation.

**Verification:**

- [ ] Tests pass: shell route, active state, More menu, escape/outside-close, and offline tests.
- [ ] Manual check: 360px, tablet portrait, 1440px, and 1900px screenshots.
- [ ] Manual check: Today is one tap from every route.

**Dependencies:** UI-2  
**Files likely touched:** `src/views/AppShell.tsx`, `src/views/views.tsx`, `src/styles/shell.css`, `tests/unit/appShell.test.tsx`  
**Estimated scope:** Medium

## Task UI-4: Simplify the reusable task interaction model

**Description:** Recompose TaskCard so task state, estimate, role/project context, and next action are immediately clear while secondary actions remain available through progressive disclosure.

**Acceptance criteria:**

- [x] Show one context-sensitive primary action and at most one visible secondary action; place remaining valid actions in an accessible labeled menu.
- [x] Separate task summary, acceptance/evidence detail, conflict/error state, and history without removing any transition.
- [x] Standard, overdue, completed, skipped, custom, and offline variants remain visually and semantically distinct.

**Verification:**

- [ ] Tests pass: every task-state/action combination and menu keyboard behavior.
- [ ] Tests pass: existing Today/Plan task command component tests.
- [ ] Manual check: dense list of eight tasks remains scannable at 360px and desktop.

**Dependencies:** UI-2  
**Files likely touched:** `src/components/TaskCard.tsx`, `src/components/TaskActionMenu.tsx`, `src/styles/tasks.css`, `tests/unit/taskCard.test.tsx`  
**Estimated scope:** Medium

## Checkpoint A: Foundation

- [ ] `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` pass.
- [ ] Shell and task interactions pass keyboard-only review.
- [ ] Approved phone/tablet/desktop light/dark screenshots are recorded.

## Task UI-5: Redesign Today as the daily command center

**Description:** Make Today answer what to do next, how much work remains, and whether overdue work needs attention.

**Acceptance criteria:**

- [x] Header presents Toronto date, week/phase, role focus, and a visual planned/completed minutes summary.
- [x] The next unfinished task is visually prioritized; remaining work is grouped cleanly by category using the compact task interaction model.
- [x] Overdue resolution and end-of-day check-in use distinct focused panels; empty/loading/error/offline states are intentionally designed without duplicate offline warnings.

**Verification:**

- [ ] Tests pass: `tests/unit/todayView.test.tsx` and accessibility checks.
- [ ] Manual check: empty, normal, overdue, completed-day, loading, error, and offline screenshots.
- [ ] Manual check: primary daily completion flow requires no unnecessary disclosure.

**Dependencies:** UI-3, UI-4  
**Files likely touched:** `src/views/TodayView.tsx`, `src/components/OverdueQueue.tsx`, `src/styles/today.css`, `tests/unit/todayView.test.tsx`  
**Estimated scope:** Medium

## Task UI-6: Redesign Plan for scanning and controlled detail

**Description:** Turn the fourteen-week plan into a navigable schedule with compact task rows, useful weekly summaries, and filters that do not dominate the page.

**Acceptance criteria:**

- [x] Week headers show dates, phase, completion ratio, progress bar, and exit-check status at a glance.
- [x] Filters collapse into a responsive toolbar/sheet with active-filter chips and a clear result count.
- [x] Expanded weeks use compact task rows and progressive task detail; custom-task creation remains obvious but secondary.

**Verification:**

- [ ] Tests pass: `tests/unit/planView.test.tsx`.
- [ ] Manual check: all fourteen weeks, no-result filters, many active filters, custom task form, and mobile layout.
- [ ] Manual check: no horizontal page overflow at 360px.

**Dependencies:** UI-4  
**Files likely touched:** `src/views/PlanView.tsx`, `src/components/PlanFilters.tsx`, `src/styles/plan.css`, `tests/unit/planView.test.tsx`  
**Estimated scope:** Medium

## Task UI-7: Redesign Projects around progress, milestones, and evidence

**Description:** Replace permanently expanded milestone forms with project summaries, progress bars, milestone timelines/checklists, and on-demand evidence editing.

**Acceptance criteria:**

- [x] Each project header shows role relevance, state/risk, budget vs actual, milestone completion, and the next gate.
- [x] Milestones are compact rows/timeline items; acceptance criteria and evidence editing open on demand.
- [x] Locked Post-Training clearly explains gate completion, the 1,200-minute swap, irreversible opt-in, and why unlock is unavailable.

**Verification:**

- [ ] Tests pass: `tests/unit/projectsView.test.tsx`.
- [ ] Manual check: active, blocked, locked, unlock-ready, and enabled project states.
- [ ] Manual check: evidence and blocker workflows remain discoverable on phone and desktop.

**Dependencies:** UI-2  
**Files likely touched:** `src/views/ProjectsView.tsx`, `src/components/ProjectProgress.tsx`, `src/styles/projects.css`, `tests/unit/projectsView.test.tsx`  
**Estimated scope:** Medium

## Checkpoint B: Daily execution

- [ ] Today, Plan, and Projects focused suites pass.
- [ ] A manual workflow completes, reschedules, skips, records evidence, edits a custom task, completes a milestone, and records a blocker.
- [ ] Before/after screenshots show reduced action noise and stronger hierarchy.

## Task UI-8: Redesign Practice around targets and correction loops

**Description:** Present coding and mock practice as goal-driven workflows with readiness progress, recent sessions, and clear correction actions.

**Acceptance criteria:**

- [x] Coding and mock sections use a responsive switcher/tabs with target, completed volume, and next-session action.
- [x] Latest-ten coding readiness is visualized as ten accessible result cells plus an 8/10 target summary.
- [x] Mock rubric results highlight low dimensions and place correction creation next to the gap that caused it.

**Verification:**

- [ ] Tests pass: `tests/unit/practiceView.test.tsx` and `tests/unit/practice.test.ts`.
- [ ] Manual check: empty, partial latest-ten, gate-met, unscored mock, fully scored mock, and correction states.
- [ ] Manual check: visualization remains understandable without color.

**Dependencies:** UI-2  
**Files likely touched:** `src/views/PracticeView.tsx`, `src/components/PracticeSummary.tsx`, `src/styles/practice.css`, `tests/unit/practiceView.test.tsx`  
**Estimated scope:** Medium

## Task UI-9: Redesign Readiness as compact evidence-based role dashboards

**Description:** Make role readiness comparable and scan-friendly while retaining explicit human assessment and evidence requirements.

**Acceptance criteria:**

- [x] Role cards/tabs show ready-count, current status, blocking gates, and optional-role labeling before gate details.
- [x] Gate rows remain compact until selected; assessment, note, and evidence controls open in a focused editor.
- [x] Ready, in-progress, at-risk, and not-assessed states use text/icon/shape as well as color.

**Verification:**

- [ ] Tests pass: `tests/unit/readinessView.test.tsx`.
- [ ] Manual check: all role/status/evidence-validation states and keyboard interaction.
- [ ] Manual check: a user can identify the next blocking gate in under five seconds.

**Dependencies:** UI-2  
**Files likely touched:** `src/views/ReadinessView.tsx`, `src/components/GateEditor.tsx`, `src/styles/readiness.css`, `tests/unit/readinessView.test.tsx`  
**Estimated scope:** Medium

## Task UI-10: Redesign Progress as an analytical dashboard

**Description:** Replace prose-heavy progress output with accurate weekly comparisons, readable charts, project/practice summaries, and responsive text equivalents.

**Acceptance criteria:**

- [x] Current/previous week planned vs completed minutes and task outcomes are presented as comparable summary cards.
- [x] Fourteen-week trend, project milestones, latest-ten coding, mock rubric trends, and readiness matrix use accessible visualizations with null/empty handling.
- [x] Metric definitions remain available through concise help/disclosure and never relabel resolution as completion.

**Verification:**

- [ ] Tests pass: `tests/unit/metrics.test.ts` plus new Progress rendering tests.
- [ ] Manual check: zero-data, partial-data, late/rescheduled/skipped, optional-enabled, and full-plan states.
- [ ] Manual check: charts have text equivalents and remain readable at 360px.

**Dependencies:** UI-2  
**Files likely touched:** `src/views/ProgressView.tsx`, `src/components/MetricChart.tsx`, `src/styles/progress.css`, `tests/unit/progressView.test.tsx`  
**Estimated scope:** Medium

## Checkpoint C: Interview readiness

- [ ] Practice, Readiness, Progress, metric, and accessibility suites pass.
- [ ] Role readiness and weakest practice dimension are identifiable without opening forms.
- [ ] Charts match the existing metric truth-table outputs.

## Task UI-11: Redesign Settings, authentication, setup, and system states

**Description:** Complete the design language on supporting pages and make account, reminder, export, authentication, first-use, loading, error, empty, and offline states intentional.

**Acceptance criteria:**

- [x] Settings groups reminder setup/status first, plan information second, data/account actions last, with clear consequence levels.
- [x] Authentication and plan-setup states use a focused branded panel with concise privacy and recovery messaging.
- [x] Shared skeleton, empty, error, offline, and conflict states are visually consistent and do not expose private data.

**Verification:**

- [ ] Tests pass: settings, auth, shell, diagnostics, and accessibility suites.
- [ ] Manual check: missing config, unauthenticated, seeding, seed failure, offline, global error, and sign-out states.
- [ ] Manual check: destructive or privacy-sensitive actions cannot be mistaken for routine actions.

**Dependencies:** UI-2, UI-3  
**Files likely touched:** `src/views/SettingsView.tsx`, `src/auth/AuthView.tsx`, `src/App.tsx`, `src/styles/system-states.css`, `tests/unit/settingsView.test.tsx`  
**Estimated scope:** Medium

## Task UI-12: Complete responsive, accessibility, visual, and device acceptance

**Description:** Remove obsolete global styles, verify the composed redesign, capture final evidence, and prevent regression before release.

**Acceptance criteria:**

- [ ] Remove superseded selectors and verify no undefined tokens, horizontal overflow, clipped controls, or layout shifts across all routes.
- [ ] Validate keyboard flow, focus visibility, semantic headings/landmarks, labels, contrast, reduced motion, and screen-reader text.
- [ ] Capture matched before/after route screenshots at phone, tablet, and desktop widths in light/dark; complete Linux and Android smoke workflows.

**Verification:**

- [ ] Run: `npm test && npm run test:integration`.
- [ ] Run: `npm run lint && npm run typecheck && npm run format:check && npm run build && npm run verify:subpath`.
- [ ] Run: `node scripts/scan-repo.mjs && node scripts/scan-dist.mjs`.
- [ ] Manual check: Linux Chromium/Firefox, Android phone/tablet, PWA standalone, offline read-only, and 5:00 PM reminder.

**Dependencies:** UI-5 through UI-11  
**Files likely touched:** `src/styles/global.css`, `tests/unit/accessibility.test.tsx`, `docs/UI_REDESIGN.md`, `docs/acceptance.md`  
**Estimated scope:** Medium

## Final approval gate

- [ ] User accepts the redesigned Today, Plan, and Progress screenshots.
- [ ] All routes preserve original functionality and private-data boundaries.
- [ ] Automated and physical-device acceptance is recorded.

## Task UI-13: Establish the DeepML-inspired visual foundation

**Description:** Replace the generic dashboard look with an editorial interview-prep system: warm neutral canvas, ink-forward typography, compact rules, a high-signal sidebar, and reusable chapter/module primitives.

**Acceptance criteria:**

- [x] The shell clearly identifies Cohere MTS Prep, the active week, and the current route without imitating DeepML branding.
- [x] Tokens and primitives support the editorial hierarchy in light and dark themes without changing interaction behavior.
- [x] Mobile remains legible with the existing navigation model and 44px targets.

**Verification:**

- [x] Tests pass: `tests/unit/uiPrimitives.test.tsx`, `tests/unit/appShell.test.tsx`, and accessibility checks.
- [x] Run: `npm run typecheck && npm run lint && npm run build`.

**Dependencies:** Existing UI-2/UI-3
**Files likely touched:** `src/styles/tokens.css`, `src/styles/primitives.css`, `src/styles/shell.css`, `src/views/AppShell.tsx`, `tests/unit/appShell.test.tsx`
**Estimated scope:** Medium

## Task UI-14: Rebuild Today and Plan as a paced curriculum

**Description:** Present the daily queue as the next training rep and the 14-week plan as numbered chapters with compact lesson rows, progress, and explicit exit checks.

**Acceptance criteria:**

- [x] Today prioritizes one next rep and groups remaining work as compact practice modules.
- [x] Plan weeks read as chapters with progress, focus, and expandable task rows instead of generic cards.
- [x] All task actions and filters retain their existing behavior.

**Verification:**

- [x] Tests pass: Today and Plan focused suites.
- [ ] Manual check: 360px and 1440px layouts remain scannable.

**Dependencies:** UI-13
**Files likely touched:** `src/views/TodayView.tsx`, `src/views/PlanView.tsx`, `src/styles/global.css`, `tests/unit/todayView.test.tsx`, `tests/unit/planView.test.tsx`
**Estimated scope:** Medium

## Task UI-15: Rebuild evidence, practice, and readiness surfaces as modules

**Description:** Apply the same training-module language to Projects, Practice, Readiness, and Progress so evidence, scores, and role readiness feel like one curriculum.

**Acceptance criteria:**

- [ ] Project evidence, practice scores, readiness gates, and progress metrics share module headings and compact data treatment.
- [ ] Dense data remains understandable without color alone.
- [ ] Existing creation, assessment, and evidence workflows remain available.

**Verification:**

- [ ] Tests pass: Projects, Practice, Readiness, Progress, and metrics suites.
- [ ] Run: `npm run typecheck && npm run lint`.

**Dependencies:** UI-13
**Files likely touched:** `src/views/ProjectsView.tsx`, `src/views/PracticeView.tsx`, `src/views/ReadinessView.tsx`, `src/views/ProgressView.tsx`, `src/styles/global.css`
**Estimated scope:** Large; implement as two commits if needed.

## Task UI-16: Complete the reference-inspired acceptance pass

**Description:** Verify the composed visual system against the approved direction and preserve functional, responsive, and accessibility quality.

**Acceptance criteria:**

- [ ] Every route has intentional light/dark, empty, loading, and error treatment with no overflow.
- [ ] Keyboard/focus, semantic labels, contrast, and reduced motion remain compliant.
- [ ] Before/after captures demonstrate an editorial curriculum rather than a generic dashboard.

**Verification:**

- [ ] Run: `npm test && npm run test:integration && npm run format:check && npm run build && npm run verify:subpath`.
- [ ] Manual check: Linux desktop and Android phone/tablet.

**Dependencies:** UI-13 through UI-15
**Files likely touched:** `src/styles/global.css`, `docs/UI_REDESIGN.md`, `docs/acceptance.md`, `tests/unit/accessibility.test.tsx`
**Estimated scope:** Medium
