# Cohere Preparation Tracker

A private, single-user PWA that turns a 14-week ML engineer interview
preparation plan into dated daily tasks, project milestones, practice records,
and evidence-based readiness gates.

- Static React/TypeScript SPA, deployed on GitHub Pages from a repository subpath.
- Hash-based navigation; Supabase PKCE magic-link auth consumed at the root before routing.
- Private cross-device state in Supabase Postgres with row-level security and
  transactional, audited database commands. No personal data lives in this
  repository or its deployed bundle.
- Fixed daily reminder at 5:00 PM `America/Toronto` via Google Calendar or an
  `.ics` fallback.
- Installable PWA; offline mode caches the static shell only and is read-only.

## Development

```bash
npm install
npm run dev          # local dev server
npm test             # unit and component tests (vitest)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run build        # typecheck + production build
npm run verify:subpath  # serve dist/ under /ml-prep/ and prove the Pages contract
```

The production base path defaults to `/ml-prep/` and can be overridden with
`VITE_BASE_PATH` (for example, when the GitHub repository has another name).

## Documentation

- `docs/WEBAPP_SPEC.md` - product and technical specification.
- `docs/PLAN_TASK_MAPPING.md` - source-plan-to-template coverage manifest.
- `docs/adr/` - architecture decision records.
- `tasks/plan.md`, `tasks/todo.md` - implementation plan and checklist.

## Privacy

This repository and its build output must contain no private progress data,
credentials, or admin keys. Authentication is limited to a single pre-invited
user; public signup is disabled. Account deletion is performed by the operator
through the Supabase Dashboard (deleting the Auth user cascades application
rows); the browser never holds admin authority.
