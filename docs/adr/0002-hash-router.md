# ADR-0002: Dependency-free hash router

Date: 2026-08-29
Status: Accepted
Task: todo.md Task 1 (scaffold and Pages pipeline)

## Context

The spec (§6, §12.1) requires hash-based navigation compatible with GitHub
Pages, and requires that the Supabase PKCE `?code=` callback at the root be
consumed **before** hash routing starts (§12.1). The app has seven flat views;
no nested routing, no route loaders.

## Decision

Use a small dependency-free hash router module
(`src/router/hashRouter.ts`) with explicit parse/navigate/default-route
primitives and unit tests, rather than importing a routing framework.

## Consequences

- The PKCE-before-routing ordering stays explicit and reviewable in
  `src/main.tsx` and the Task 5 auth bootstrap.
- Fewer dependencies and less bundle weight for MVP.
- If routing needs grow beyond flat views (not in the MVP boundary), this
  decision can be revisited; the registry in `src/views/views.tsx` is the
  single integration point.
