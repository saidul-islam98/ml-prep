# Operator runbook

Short, exact procedures for the failure modes this app can hit. The
application is a static SPA (GitHub Pages) plus a hosted Supabase project;
there is no custom server.

## Account deletion (the only destructive operation)

Self-service deletion is deliberately out of MVP: the browser never holds
admin authority (WEBAPP_SPEC.md section 13).

1. Sign in to the Supabase Dashboard and open the project.
2. Go to **Authentication -> Users**, find the sole user by email.
3. Delete the user. `on delete cascade` removes every owned application row
   (profiles, tasks, task_events, projects, milestones, practice sessions,
   mock scores, readiness gates, daily check-ins) - this cascade is covered
   by tests in `tests/integration/ownership.test.ts`.
4. Verify: the app now shows the setup screen after the next sign-in, and
   signing in with the same email fails (the user no longer exists).
5. To recreate the account: invite the user again from the Dashboard, then
   sign in once - the app re-seeds the plan template automatically.

Limits: deletion is immediate and unrecoverable. Export your data first
(Settings -> Export all data). The export is a JSON snapshot; there is no
import/restore path in MVP by design (spec section 18).

## Supabase outage

Symptom: views show "Could not load your tasks" and mutations fail with a
visible error (no false success).

1. Check status.supabase.com and the project dashboard.
2. The static shell keeps loading (service worker caches static assets
   only); the app is visibly read-only. No local writes queue up - data
   stays server-authoritative.
3. When the project returns, refetch happens on focus/reconnect; no manual
   action is needed.

## Auth redirect error (PKCE)

Symptom: after following the magic link, the app shows "The sign-in link was
invalid or has expired."

1. Request a fresh sign-in link from the auth screen and follow it on the
   same device (PKCE verifiers are per-device).
2. Check that the exact redirect origin is in the Supabase allowlist:
   - production: `https://<owner>.github.io/<repo>/`
   - development: `http://localhost:5173/` and `http://127.0.0.1:5173/`
3. An unknown email never creates an account (`shouldCreateUser: false`);
   the sign-up must exist in the Dashboard user list first.

## Failed deployment (GitHub Pages)

1. Open the Actions tab; the failing step is one of: typecheck, lint,
   format, unit tests, integration tests, production build, subpath verify,
   artifact scan. Fix locally and push - never deploy from a red state.
2. The artifact scan (`scripts/scan-dist.mjs`) fails on any secret pattern
   or private term in the bundle. Treat the finding as blocking.
3. If Pages itself is broken (Actions green, site stale), redeploy from
   Actions -> Run workflow -> Re-run deploy job.

## Calendar reminder

The reminder is a user-owned Google Calendar event. If it stops firing:

1. Check the event still exists at 5:00 PM America/Toronto daily.
2. After DST boundaries (second Sunday of March, first Sunday of November),
   confirm the occurrence still reads 5:00 PM local.
3. Re-import path: Settings -> Download .ics, delete the old event first,
   then import (duplicate prevention), then mark verified.

## Dependency updates

Dependabot may be enabled normally. After updates run: `npm run typecheck`,
`npm run lint`, `npm test`, `npm run test:integration` (requires
`npm run supabase:start`), `npm run build`, `npm run verify:subpath`,
`node scripts/scan-dist.mjs`.

## Database schema migrations (hosted Supabase)

CI/CD runs all migrations against an ephemeral local Supabase stack during automated tests (`npm run test:integration`), but the GitHub Actions deployment workflow deploys only the static application to GitHub Pages. It does not automatically run migrations against hosted production Supabase databases.

When adding or updating schema migrations (such as `supabase/migrations/20260830000000_task_execution_progress.sql`):

1. **Via Supabase CLI**:
   Link the local repository to your remote Supabase project and push unapplied migrations:
   ```sh
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
2. **Via Supabase Dashboard**:
   Open the **SQL Editor** in the Supabase Dashboard, paste the contents of `supabase/migrations/20260830000000_task_execution_progress.sql`, and execute it.
3. **Troubleshooting missing table errors**:
   If Focus Mode indicates `Save failed (PGRST205)` or reports `Could not find the table 'task_execution_progress' in the schema cache`, the database table is missing from your hosted Supabase project. Applying the migration as described above resolves the issue.

## Secrets policy

- The frontend holds only the Supabase URL and publishable key - public
  identifiers, not secrets.
- The service-role key lives ONLY in the Supabase Dashboard and local test
  output; it must never enter the repository, CI variables exposed to
  builds, or any artifact. `scripts/scan-dist.mjs` and
  `scripts/scan-repo.mjs` guard this.
