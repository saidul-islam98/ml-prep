# ml-prep

A small web app I built to run a 14-week interview-preparation plan across my
laptop and Android devices. The plan window is fixed (August 31 - December 6,
2026): fourteen weeks, 196 planned hours, three portfolio projects, thirty
reviewed coding problems, mock interviews, and readiness gates per target
role. The app turns that markdown plan into dated daily tasks and tracks them
with the kind of evidence I can actually defend in an interview.

Live at <https://saidul-islam98.github.io/ml-prep/>.

The code is public on purpose. Everything personal - progress, notes,
evidence links - lives in Supabase behind row-level security. The bundle
contains only two public configuration values (the project URL and its
publishable key); there are no secrets in this repository or its build
output, and CI enforces that with scanners.

## What it does

- **Today** - the day's tasks grouped by category, planned vs completed
  minutes, and an overdue queue that forces an explicit choice: reschedule
  or skip. Overdue work is never rolled over silently.
- **Plan** - all fourteen weeks with exit checks, filters, and custom task
  editing. Completed, skipped, archived, late, and rescheduled work are
  tracked as separate outcomes so a skipped task can never flatter the
  numbers.
- **Projects** - three portfolio projects with milestones and completion
  gates. The optional third project stays locked in the database until the
  first two have evidence, then unlocks with an exact 20-hour swap that
  keeps the plan at 196 hours.
- **Practice** - coding sessions and mock interviews scored on an
  eight-dimension rubric (1-5). Coding readiness reads the latest ten
  qualifying sessions, not lifetime volume.
- **Readiness** - per-role gate assessments. Marking a gate "ready" requires
  a note or an HTTPS evidence link; the app never invents a confidence score.
- **Progress** - cohort-true metrics: on-time completion, resolution,
  planned-minute attainment, actual effort, and a fourteen-week trend.
- **Settings** - a fixed 5:00 PM America/Toronto calendar reminder (Google
  Calendar link or `.ics` download) with installed/verified status, JSON
  export, and sign-out.

## How it's built

React 19 + TypeScript + Vite, hash routing, TanStack Query, plain CSS with
light/dark themes. Auth is Supabase magic links with PKCE; the callback is
consumed at the page root before routing starts. All task writes go through
Postgres functions that also append immutable audit events, and concurrent
edits are settled with an expected-revision check - a stale write gets the
current row back instead of overwriting. Every table has row-level security
and column-level grants. Installable as a PWA; the service worker caches
static assets only, so offline shows the shell read-only and never fakes a
successful save.

## Local development

Requires Node 20+ (developed on 24) and Docker.

```bash
git clone https://github.com/saidul-islam98/ml-prep.git
cd ml-prep
npm install
npx supabase start        # local stack: API :54321, DB :54322, Studio :54323, Mailpit :24324
cp .env.example .env.local
npm run supabase:reset    # apply migrations to the local database
npm run dev
```

`.env.example` documents the two build-time values; `.env.local` defaults
match the local stack. To try sign-in locally, request a magic link and open
it from Mailpit at <http://localhost:24324>.

## Testing

```bash
npm test                  # unit and component tests (Vitest + Testing Library)
npm run test:integration  # needs `npx supabase start`: RLS and ownership
                          # boundaries, task commands and revision races,
                          # seed rollback and repair, PKCE sign-in via Mailpit
npm run build && npm run verify:subpath   # Pages subpath + service-worker contract
node scripts/scan-dist.mjs && node scripts/scan-repo.mjs   # secret scans
```

The integration suite provisions its own throwaway users against the local
stack and never touches production.

## Deployment

Pushes to `main` run typecheck, lint, format, all tests, the production
build, and the secret scans, then deploy to GitHub Pages. Two repository
variables are required: `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY` - public identifiers, not secrets. The
linked Supabase project needs the migrations applied, public signup
disabled, and the Pages URL in the redirect allowlist. Details live in
`docs/acceptance.md` and `docs/runbook.md`.

## Documentation

- `docs/WEBAPP_SPEC.md` - product and technical specification
- `docs/PLAN_TASK_MAPPING.md` - how the markdown plan maps to database
  records, reconciled to exactly 196 hours
- `docs/runbook.md` - operations: account deletion, outage, auth redirect
  failures, calendar re-import
- `docs/acceptance.md` - release checklist and device tests
- `docs/adr/` - architecture decision records
- `GATES.md` - release gate ledger

## Data and privacy

Progress is visible only to the signed-in user. There is no self-service
account deletion: deleting the auth user in the Supabase dashboard cascades
all application rows, and the browser never holds admin credentials. All
owned data can be exported as JSON from Settings at any time.
