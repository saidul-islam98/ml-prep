/**
 * Authenticated application: first-use seeding gate, then the shell. Seeding
 * failures are retryable and idempotent (WEBAPP_SPEC.md sections 7.1 and 16).
 */

import { useEffect } from "react";
import { useProfile, useSeedPlan } from "../hooks/useProfile";
import { useCurrentPlanWeek } from "../hooks/usePlanWeek";
import { AppShell } from "./AppShell";
import { resolveView } from "./views";
import { VIEWS } from "./views";

export function AuthenticatedApp({
  route,
  initialAuthError,
}: {
  route: { path: string };
  initialAuthError?: string;
}) {
  const { data: profile, isLoading } = useProfile();
  const seed = useSeedPlan();
  const currentWeek = useCurrentPlanWeek();

  useEffect(() => {
    if (!isLoading && (profile == null || profile.template_version !== 1) && seed.isIdle) {
      seed.mutate();
    }
    // Seed once per missing profile.
  }, [isLoading, profile, seed]);

  const needsSeed = profile == null || profile.template_version !== 1;

  if (isLoading || (needsSeed && seed.isPending)) {
    return (
      <div className="app-shell" role="status" aria-live="polite">
        <main className="app-main">
          <section className="placeholder">
            <h1>Preparing your plan</h1>
            <p>Setting up the fourteen-week schedule for the first time…</p>
          </section>
        </main>
      </div>
    );
  }

  if (needsSeed) {
    return (
      <div className="app-shell">
        <main className="app-main">
          <section className="placeholder" aria-labelledby="seed-error-title">
            <h1 id="seed-error-title">Setup could not finish</h1>
            <p>
              The preparation plan was not fully set up. This is safe to retry - setup is idempotent
              and will not duplicate anything.
            </p>
            <button type="button" onClick={() => seed.mutate()}>
              Retry setup
            </button>
          </section>
        </main>
      </div>
    );
  }

  const active = resolveView(route.path);

  return (
    <AppShell active={active.key} currentWeek={currentWeek}>
      {initialAuthError && (
        <p role="alert" className="auth-error">
          {initialAuthError}
        </p>
      )}
      <active.component />
    </AppShell>
  );
}

export { VIEWS };
