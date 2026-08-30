# Implementation Plan: Cohere Preparation Tracker UI Redesign

## Overview

Redesign the existing tracker as a calm, focused preparation workspace rather than a collection of database forms. Preserve every route, workflow, Supabase contract, offline rule, and accessibility requirement while rebuilding visual hierarchy, responsive navigation, task interaction density, progress communication, and empty/loading/error states.

This plan is based on the seven desktop screenshots in `../trash-ui/`, the current React view/component markup, `src/styles/global.css`, and the UX requirements in `docs/WEBAPP_SPEC.md`.

## Current UI Audit

### System-wide findings

- The 1901px screenshots use a narrow roughly 960px content column and a 140px rail, leaving most desktop space empty.
- The header contains only the product name and provides no plan status, current week, account affordance, or page context.
- Every screen uses nearly identical dark rectangles, one-pixel borders, and blue buttons. Cards, summaries, forms, warnings, and empty states have almost the same visual weight.
- Typography has only a few size/weight levels, producing weak scanning hierarchy and long gray text lines.
- The design has no icon language, illustration, meaningful data visualization, or recognizable product character.
- Seven narrow-screen navigation destinations are intended to share one 56px bottom bar. Labels alone cannot remain comfortably readable and tappable at 360px.
- `--space-5` is referenced but not defined.
- Loading, offline, and empty states are mostly unstyled text or ordinary bordered cards.

### Workflow findings

- **Today:** the most important page does not identify a next action. With no tasks it is three generic boxes surrounded by empty space; with tasks, the summary has no graphical progress.
- **Task cards:** Start, Complete, Reschedule, Skip, Add evidence, History, and sometimes Edit/Archive appear as equal buttons. This obscures the primary action and makes long plans visually exhausting.
- **Plan:** six filters appear as an undifferentiated form row. Expanded weeks contain full task cards, multiplying action noise. Weekly progress is text rather than a glanceable bar.
- **Projects:** every milestone permanently displays an evidence URL input and Save button. Acceptance criteria, completion state, target date, and evidence compete for attention.
- **Practice:** the empty page is mostly whitespace with two isolated buttons. Coding readiness has no visual target or history summary.
- **Readiness:** every gate is a permanently expanded assessment form. The page is long before any evidence exists and role-level readiness is hard to compare.
- **Progress:** the most analytical screen presents several key signals as prose. The fourteen-week chart is only 88px tall and cannot communicate trend or comparisons well.
- **Settings:** all groups are visually interchangeable, and the primary setup action, status, data export, and sign-out are not prioritized by frequency or consequence.

## Product and Visual Direction

### Design concept

Use a **calm mission-control** aesthetic: disciplined, technical, and encouraging without becoming gamified. The interface should answer three questions immediately:

1. What matters today?
2. Am I on track for each target role?
3. What evidence or correction should I work on next?

### Architecture decisions

- Keep React, TypeScript, hash routing, TanStack Query, and the existing API/data contracts.
- Build a small repository-owned component system rather than introducing a full UI framework.
- Use semantic design tokens for canvas, elevated surfaces, text, borders, accent, success, warning, danger, role colors, radii, shadows, and motion.
- Continue following system light/dark preference. Both themes receive deliberate palettes rather than simple color inversion.
- Use a wider desktop content grid (up to approximately 1280px) and page-specific layouts; do not force every page into the same reading width.
- Desktop retains all seven destinations in a 224px sidebar. Mobile uses five bottom destinations: Today, Plan, Projects, Practice, and More; More exposes Readiness, Progress, and Settings in an accessible sheet/menu.
- Keep Today one tap away everywhere.
- Use icons as supporting cues only. Every icon control retains an accessible text label or `aria-label`.
- Reduce task-card actions to one primary action, one context-sensitive secondary action, and an overflow menu. No workflow is removed.
- Use progressive disclosure for evidence forms, gate assessment forms, milestone details, history, filters, and infrequent settings.
- Use CSS/SVG charts for the small existing datasets; avoid a heavy charting dependency unless implementation proves native rendering inadequate.
- Preserve 44x44px targets, visible focus, WCAG AA contrast, reduced-motion support, semantic landmarks, timezone-safe dates, and visibly read-only offline behavior.

## Information Architecture

```text
App shell
├── Desktop sidebar
│   ├── Brand + current week
│   ├── Seven route links
│   └── Offline/account status
├── Mobile top bar
│   └── Page title + context action
├── Mobile bottom bar
│   ├── Today
│   ├── Plan
│   ├── Projects
│   ├── Practice
│   └── More → Readiness / Progress / Settings
└── Page
    ├── Page header
    ├── Summary / next action
    ├── Primary content
    └── Progressive detail
```

## Task List

### Phase 1: Foundation and interaction model

- [ ] Task UI-1: Capture the redesign contract and visual baseline
- [ ] Task UI-2: Introduce semantic tokens and shared UI primitives
- [ ] Task UI-3: Rebuild responsive application navigation
- [ ] Task UI-4: Simplify the reusable task interaction model

### Checkpoint A: Foundation

- [ ] Light/dark shell works at 360px, tablet, 1440px, and 1900px.
- [ ] Today remains one tap away and all seven routes remain reachable.
- [ ] Keyboard navigation, focus order, labels, and 44px targets pass.
- [ ] Existing task commands and component tests remain green.

### Phase 2: Daily execution surfaces

- [ ] Task UI-5: Redesign Today as the daily command center
- [ ] Task UI-6: Redesign Plan for scanning and controlled detail
- [ ] Task UI-7: Redesign Projects around progress, milestones, and evidence

### Checkpoint B: Execution

- [ ] A user can find and complete the next task without opening unrelated controls.
- [ ] Weekly progress and project risk are understandable without reading paragraphs.
- [ ] No task, milestone, evidence, blocker, filter, or optional-track workflow is lost.
- [ ] Today, Plan, and Projects pass focused component and accessibility tests.

### Phase 3: Interview-readiness surfaces

- [ ] Task UI-8: Redesign Practice around targets and correction loops
- [ ] Task UI-9: Redesign Readiness as compact evidence-based role dashboards
- [ ] Task UI-10: Redesign Progress as an analytical dashboard

### Checkpoint C: Readiness

- [ ] Coding latest-ten status, mock rubric gaps, role gates, and project progress are glanceable.
- [ ] Every chart has a text equivalent and handles zero denominators.
- [ ] Dense tables and charts remain usable at 360px without horizontal page overflow.

### Phase 4: Supporting states and release

- [ ] Task UI-11: Redesign Settings, authentication, setup, and system states
- [ ] Task UI-12: Complete responsive, accessibility, visual, and device acceptance

### Checkpoint D: UI complete

- [ ] All existing unit and integration tests pass.
- [ ] Typecheck, lint, formatting, production build, subpath, and safety scans pass.
- [ ] Seven routes are manually reviewed in light/dark at phone, tablet, and desktop widths.
- [ ] Linux and Android smoke workflows pass without consulting developer instructions.
- [ ] Before/after screenshots demonstrate materially improved hierarchy and action clarity.

## Dependency Graph

```text
UI-1 audit/contract
  └── UI-2 tokens/primitives
        ├── UI-3 shell/navigation
        └── UI-4 task interaction
              ├── UI-5 Today
              └── UI-6 Plan
        UI-2 ──────────── UI-7 Projects
        UI-2 ──────────── UI-8 Practice
        UI-2 ──────────── UI-9 Readiness
        UI-2 ──────────── UI-10 Progress
        UI-3 + UI-2 ───── UI-11 supporting states
        UI-5..UI-11 ───── UI-12 acceptance
```

## Risks and Mitigations

| Risk                                          | Impact | Mitigation                                                                                                     |
| --------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| Styling refactor changes behavior             | High   | Keep API/hooks unchanged; redesign one vertical surface at a time; retain focused component tests              |
| Task actions become hard to discover          | High   | Keep primary action visible; use labeled More menu; test every state/action combination                        |
| Mobile More navigation hides important routes | Medium | Today remains persistent; show badges/status in More; test keyboard, screen reader, and outside-click behavior |
| Dark theme remains muddy                      | Medium | Define theme-specific semantic tokens and contrast-check both themes                                           |
| New charts misrepresent metrics               | High   | Consume existing metric outputs only; preserve formula labels, null states, and text equivalents               |
| Large CSS rewrite causes regressions          | Medium | Split tokens/primitives/page styles; remove obsolete selectors only after each page lands                      |
| Visual polish increases bundle size           | Medium | Prefer CSS and small SVGs; measure the production bundle at every checkpoint                                   |
| Existing screenshots cover desktop only       | Medium | Add phone/tablet/light-theme captures during UI-1 and retain them for final comparison                         |

## Non-goals

- Changing preparation-plan content, task dates, metrics formulas, reminder behavior, authentication, or Supabase schema.
- Adding social features, gamification, public profiles, or a general-purpose task planner.
- Replacing the current application stack or adding a large component framework.
- Treating attractive screenshots as sufficient without keyboard, accessibility, and workflow verification.

## Approval Gate

Implementation should begin only after the user approves:

- the calm mission-control direction;
- the mobile five-item navigation with a More menu;
- the compact task action model;
- the plan recorded in `tasks/ui-redesign-todo.md`.
