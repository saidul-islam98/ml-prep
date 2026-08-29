# Production acceptance checklist (todo.md Task 18)

Status: **all automatable checks pass locally (2026-08-29)**; the remaining
items require the external resources listed in `tasks/plan.md` (public GitHub
repository with Pages, production Supabase project, Android devices).

## 1. Automated gates (all green)

- [x] `npm run typecheck` - clean
- [x] `npm run lint` - clean
- [x] `npm run format:check` - clean
- [x] `npm test` - 20 files / 177 tests (router, shell, ICS, Google Calendar,
      template, schedule classification, metrics truth table, practice,
      SW negative-cache, diagnostics, accessibility, view components)
- [x] `npm run test:integration` - 6 files / 77 tests (harness, RLS and
      ownership boundary, task commands and CAS races, seed/unlock and the
      196-hour swap, PKCE magic-link E2E through Mailpit, data-layer sync,
      export ownership)
- [x] `npm run build` - production build under the repository subpath
- [x] `npm run verify:subpath` - subpath asset contract
- [x] `node scripts/scan-dist.mjs` + `node scripts/scan-repo.mjs` - no
      secrets or private progress data in the artifact or tracked files
- [x] Template artifact sync (`scripts/generate-template-artifacts.mjs` +
      `git diff --exit-code`)

## 2. Repository and deployment (user, one-time)

1. Create a **public** GitHub repository and push this repository to it
   (branch `main`). Pushing requires your explicit approval per the working
   agreement - nothing has been pushed.
2. Repository **Settings -> Pages -> Source: GitHub Actions**.
3. Add repository **variables** (not secrets) if the repository name is not
   `ml-prep`: nothing extra - the workflow derives `VITE_BASE_PATH` from the
   repository name. Supabase variables come next.
4. Create the **production Supabase project**:
   - Invite the single user (Authentication -> Users -> Invite).
   - Disable public signup (Authentication -> Providers -> Email: disable
     sign ups; the project-level signup toggle must also be off).
   - Add redirect URLs: `https://<owner>.github.io/<repo>/` (exact root).
   - Run the migrations: `npx supabase link --project-ref <ref>` then
     `npx supabase db push` (the migrations folder is the source of truth).
   - Set repository variables `VITE_SUPABASE_URL` and
     `VITE_SUPABASE_PUBLISHABLE_KEY` (public identifiers, not secrets) and
     wire them into the build step env of `.github/workflows/deploy.yml`.
5. Push to `main`. The workflow builds and deploys; the URL becomes
   `https://<owner>.github.io/<repo>/`.

## 3. Device acceptance (user)

Linux (Chromium and Firefox):

- [ ] Sign in via magic link; the root `?code=` callback lands before hash
      routing (URL ends clean, no `?code=`).
- [ ] Today shows the seeded 118-task plan (109 required visible; the 9
      optional Post-Training tasks hidden until enabled).
- [ ] Complete a task with actual minutes + HTTPS evidence; verify in a
      second browser profile that the state synced.
- [ ] 360 px width: bottom navigation, no horizontal scroll; 44 px targets.
- [ ] Keyboard-only: skip link, focus outlines, all actions reachable.

Android phone and tablet (Chrome):

- [ ] Sign in; same data as desktop.
- [ ] Install as PWA (Add to Home Screen); standalone launch; app icon.
- [ ] Offline: reload while offline - static shell loads, views show the
      read-only/offline notice, mutations are disabled.
- [ ] Complete/reopen/overdue-reschedule/skip flows; conflict UX via two
      simultaneous sessions (stale revision shows Discard/Apply to latest).

Calendar (see also `docs/calendar-spike.md` results):

- [ ] Settings -> Add to Google Calendar; event "Cohere preparation check-in"
      at 5:00 PM America/Toronto, daily, 15 minutes, generic description with
      the deployed Today URL.
- [ ] Verify the next occurrence on the Android device.
- [ ] After the DST boundary (2026-11-01), confirm the occurrence still reads
      5:00 PM local.
- [ ] Settings -> Download .ics -> import (delete the old event first) ->
      mark verified on device.

Optional track:

- [ ] Projects view: Post-Training card locked; attempt unlock without
      evidence - server rejection message visible.
- [ ] After both required projects' gates have evidence: unlock succeeds,
      1,200 minutes swap in, plan total remains 196 hours, tasks appear.

## 4. Performance (user, after deployment)

On an authenticated warm load over stable broadband:

1. Open the deployed Today view.
2. Measure "first useful interactive state" (Today content rendered and
   buttons responsive) - browser Performance panel or Lighthouse TTI.
3. Repeat **20 times** (fresh tab, cached SW, same network).
4. Record all 20 values and the p95 in this file. The gate is **p95 <= 2.5 s**
   (WEBAPP_SPEC.md section 22).

Results:

- [ ] 20 trials recorded; p95 = ______ s

## 5. Final sign-off

- [ ] Every MVP item maps to a completed task in `tasks/todo.md`.
- [ ] No privileged secret or private progress data in the repository or the
      deployed bundle (automated scans green; manual review done).
- [ ] RLS/RPC isolation re-verified against the production project once
      (two-user test against disposable users, never production data).
- [ ] The user completes one full daily workflow on Linux and Android without
      developer instructions.
