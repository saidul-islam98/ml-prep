import { useEffect, useState } from "react";
import { parseHash, type Route } from "./router/hashRouter";
import { resolveView } from "./views/views";
import { AppShell } from "./views/AppShell";
import { useSession } from "./auth/useSession";
import { AuthView } from "./auth/AuthView";
import { isSupabaseConfigured } from "./lib/supabaseClient";

/**
 * Root component. Subscribes to hash navigation, gates on the Supabase
 * session, and renders the active view. Views are placeholders until their
 * implementation tasks land; the application is runnable and navigable from
 * the first scaffold increment.
 */
export default function App({ initialAuthError }: { initialAuthError?: string }) {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  const session = useSession();

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (!isSupabaseConfigured()) {
    return <ConfigErrorState />;
  }

  if (session.status === "loading") {
    return (
      <div className="app-shell" role="status" aria-live="polite">
        <p className="loading-note">Loading…</p>
      </div>
    );
  }

  if (session.status === "unauthenticated") {
    return <AuthView />;
  }

  const active = resolveView(route.path);

  return (
    <AppShell active={active.key}>
      {initialAuthError && (
        <p role="alert" className="auth-error">
          {initialAuthError}
        </p>
      )}
      <active.component />
    </AppShell>
  );
}

function ConfigErrorState() {
  return (
    <div className="app-shell">
      <main className="app-main" id="main">
        <section aria-labelledby="config-title" className="placeholder">
          <h1 id="config-title">Setup incomplete</h1>
          <p>
            This deployment is missing its Supabase configuration (public URL and publishable key).
            These are public identifiers set at build time - no private data is shown here.
          </p>
        </section>
      </main>
    </div>
  );
}
