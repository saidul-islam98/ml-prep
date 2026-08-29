# ADR-0001: Vite base path defaults to /ml-prep/ and is env-overridable

Date: 2026-08-29
Status: Accepted
Task: todo.md Task 1 (scaffold and Pages pipeline)

## Context

The application deploys to GitHub Pages from a public repository at a
repository subpath (`https://<owner>.github.io/<repo>/`). The spec (§12.3)
requires the Vite `base` to be configured for the repository subpath, but the
final GitHub repository name is an external prerequisite not yet confirmed.

## Decision

- `vite.config.ts` sets `base` from `process.env.VITE_BASE_PATH`, defaulting
  to `/ml-prep/` (matching the local repository name `ml-prep`).
- The CI workflow builds with `VITE_BASE_PATH=/<github.repository>/` so the
  deployed artifact always matches the actual repository name without code
  changes.
- `scripts/verify-subpath.mjs` serves `dist/` under the same base and proves
  every root-relative asset resolves, guarding the contract in CI.

## Consequences

- If the repository is named `ml-prep`, nothing to configure.
- If it is named differently, CI env var covers it; local `npm run build`
  uses the default, and `npm run verify:subpath` uses the matching default.
