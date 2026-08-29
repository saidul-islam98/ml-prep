import type { ReactNode } from "react";
import { VIEWS, type ViewKey } from "./views";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

interface AppShellProps {
  active: ViewKey;
  children: ReactNode;
}

/**
 * Application shell with semantic landmarks: a banner, a <nav> that renders
 * as a bottom bar on narrow screens and a side rail on wide screens, and the
 * main content region. Interactive targets are at least 44x44 px and Today is
 * always the first navigation entry (WEBAPP_SPEC.md §15). Navigation uses
 * plain hash anchors so the browser's back/forward history works unchanged.
 */
export function AppShell({ active, children }: AppShellProps) {
  const entries = Object.entries(VIEWS) as [ViewKey, (typeof VIEWS)[ViewKey]][];
  const online = useOnlineStatus();

  return (
    <div className="app-shell" data-offline={!online}>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <header className="app-banner">
        <p className="app-title">Cohere Preparation Tracker</p>
      </header>
      <nav className="app-nav" aria-label="Primary">
        <ul className="app-nav-list">
          {entries.map(([key, view]) => (
            <li key={key}>
              <a
                href={`#${view.path}`}
                className={key === active ? "app-nav-link active" : "app-nav-link"}
                aria-current={key === active ? "page" : undefined}
              >
                {view.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <main className="app-main" id="main">
        {!online && (
          <p role="status" className="task-offline">
            You are offline. Saved data remains visible, but editing is disabled until you
            reconnect.
          </p>
        )}
        <fieldset className="app-content" disabled={!online} aria-disabled={!online}>
          {children}
        </fieldset>
      </main>
    </div>
  );
}
