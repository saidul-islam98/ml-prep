# UI redesign contract

Plan: `tasks/ui-redesign-plan.md` - approved by the owner on 2026-08-30
(calm mission-control direction, five-item mobile navigation with a More
sheet, compact task action model).

## Visual baseline

Source audit found: a 960px content column floating in a 1900px window, a
header with no context, uniform dark rectangles for every kind of content,
weak type hierarchy, no icon language or data visualization, six undiff-
erentiated filters, permanently expanded forms on Projects and Readiness,
prose where charts belong, and `--space-5` referenced but undefined.

Baselines captured for the redesign: desktop 1440/1900, tablet 768,
phone 360; light and dark. Source desktop screenshots: `../trash-ui/`.

## Design tokens (Task UI-2)

- Canvas / surface / raised surfaces, per theme.
- Text (strong, default, muted) and border colors per theme.
- Accent (interactive), success, warning, danger - each with a soft
  background variant - plus per-role colors (data_eval, agent_env,
  post_training).
- Type scale 12/14/16/18/22/28px with 400/500/600/700 weights.
- Spacing steps 4..40px (`--space-1..8`, defines the previously missing
  `--space-5`), radii 6/10/14/full, three elevation shadows, motion
  durations with reduced-motion resets.

## Wireframes

### Shell

```
Desktop >=1024px                 Mobile <1024px
+--------+-------------------+   +--------------------------+
| brand  | page content      |   | top bar: title  [action] |
| week   | (max 1280px,      |   +--------------------------+
| ------ |  page-specific    |   | page content             |
| Today  |  widths)          |   |                          |
| Plan   |                   |   +--------------------------+
| ...7   |                   |   | Today Plan Projects      |
| routes |                   |   | Practice  [More]         |
| status |                   |   +--------------------------+
+--------+-------------------+   More sheet: Readiness/Progress/
                                 Settings (Escape/outside close)
```

### Task card (compact model)

```
+--------------------------------------------------+
| [state dot] Title (strong)          [state badge]|
| category . estimate . roles . project            |
| [PRIMARY ACTION] [More v]            History_    |
| (overdue variant: original date + count chip)    |
| > acceptance / evidence disclosure               |
| conflict & error banners inline when present     |
+--------------------------------------------------+
Primary: not_started=Start, in_progress=Complete,
completed/skipped=Reopen. More menu: Reschedule, Skip,
Add/Edit evidence, Edit task (custom), Archive (custom).
All transitions preserved; none duplicated.
```

### Page patterns

- **Today**: header (date, week/phase, role chips) -> progress card
  (bar + counts) -> overdue warning panel (when present) -> category
  groups with the next unfinished task first -> check-in card.
- **Plan**: filter disclosure with active chips + result count ->
  week cards (dates, phase, progress bar, exit check) -> compact task
  rows in expanded weeks -> custom task form behind a secondary button.
- **Projects**: card header (roles, state, budget bar, milestone count,
  next gate) -> compact milestone rows (checkbox, target, evidence
  disclosure) -> blocker note -> locked panel for Post-Training.
- **Practice**: tabs Coding | Mocks -> readiness cells (10) with 8/10
  target -> sessions -> correction action beside the low rubric scores.
- **Readiness**: role cards (ready count, blocking gate) -> compact gate
  rows -> focused assessment editor on demand.
- **Progress**: summary cards -> 14-week trend with text equivalent ->
  effort/workload -> milestone, practice, readiness summaries.
- **Settings**: reminder first, plan info, export, account, deletion -
  ordered by frequency and consequence.
- **System states**: skeleton blocks for loading, branded panel for
  auth/setup, one offline announcement in the shell (no per-page
  duplicates), error banners scoped to their card.

## Accessibility contract (unchanged)

44x44px targets, visible focus, WCAG AA contrast in both themes,
reduced-motion resets, semantic landmarks/labels, timezone-safe dates,
read-only offline, icon-only controls labeled.

## Manual verification ledger

Device/width screenshots and keyboard reviews are recorded per
checkpoint in `tasks/ui-redesign-todo.md` and finally in
`docs/acceptance.md`.
