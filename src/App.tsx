import { useEffect, useState } from "react";
import { parseHash, type Route } from "./router/hashRouter";
import { resolveView } from "./views/views";
import { AppShell } from "./views/AppShell";

/**
 * Root component. Subscribes to hash navigation and renders the active view.
 * Views are placeholders until their implementation tasks land; the
 * application is runnable and navigable from the first scaffold increment.
 */
export default function App() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const active = resolveView(route.path);

  return (
    <AppShell active={active.key}>
      <active.component />
    </AppShell>
  );
}
