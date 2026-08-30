/**
 * Application shell (Tasks UI-3): desktop sidebar with plan context and all
 * seven routes; mobile top bar and a five-item bottom navigation whose More
 * sheet exposes Readiness, Progress, and Settings. Offline state is
 * announced once and disables content editing.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { VIEWS, type ViewKey } from "./views";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { Badge } from "../components/ui";

const PRIMARY_KEYS: ViewKey[] = ["today", "plan", "projects", "practice"];
const MORE_KEYS: ViewKey[] = ["readiness", "progress", "settings"];

interface AppShellProps {
  active: ViewKey;
  currentWeek?: { week_number: number; phase: string } | null;
  children: ReactNode;
}

export function AppShell({ active, currentWeek, children }: AppShellProps) {
  const online = useOnlineStatus();

  return (
    <div className="app-shell" data-offline={!online}>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      <aside className="sidebar">
        <div className="sidebar__brand">
          <p className="sidebar__title">ml-prep</p>
          <p className="sidebar__window">Aug 31 - Dec 6, 2026</p>
          {currentWeek && (
            <p className="sidebar__week">
              Week {currentWeek.week_number} - {currentWeek.phase}
            </p>
          )}
        </div>
        <nav className="sidebar__nav" aria-label="Primary">
          <ul>
            {(Object.entries(VIEWS) as [ViewKey, (typeof VIEWS)[ViewKey]][]).map(([key, view]) => (
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
        <div className="sidebar__status">
          {!online ? (
            <Badge tone="warning">Offline - read-only</Badge>
          ) : (
            <Badge tone="success">Online</Badge>
          )}
        </div>
      </aside>

      <div className="app-column">
        <header className="topbar">
          <p className="topbar__title">{VIEWS[active].label}</p>
          {!online ? <Badge tone="warning">Offline</Badge> : null}
        </header>

        {!online && (
          <p role="status" className="task-offline shell-offline">
            You are offline. Saved data remains visible, but editing is disabled until you
            reconnect.
          </p>
        )}

        <main className="app-main" id="main">
          <fieldset className="app-content" disabled={!online} aria-disabled={!online}>
            {children}
          </fieldset>
        </main>

        <nav className="bottombar" aria-label="Mobile">
          <ul>
            {PRIMARY_KEYS.map((key) => (
              <li key={key}>
                <a
                  href={`#${VIEWS[key].path}`}
                  className={key === active ? "app-nav-link active" : "app-nav-link"}
                  aria-current={key === active ? "page" : undefined}
                >
                  {VIEWS[key].label}
                </a>
              </li>
            ))}
            <li>
              <MoreMenu active={active} />
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}

/** Mobile More sheet: the three remaining destinations, focus-managed. */
function MoreMenu({ active }: { active: ViewKey }) {
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    function onClick(event: MouseEvent) {
      if (sheetRef.current && !sheetRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const anyMoreActive = MORE_KEYS.includes(active);

  return (
    <div className="more-wrap" ref={sheetRef}>
      <button
        type="button"
        ref={triggerRef}
        className={anyMoreActive ? "bottombar__more active" : "bottombar__more"}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        More
      </button>
      {open ? (
        <div className="more-sheet" role="menu" aria-label="More pages">
          {MORE_KEYS.map((key) => (
            <a
              key={key}
              role="menuitem"
              href={`#${VIEWS[key].path}`}
              className={key === active ? "more-sheet__item active" : "more-sheet__item"}
              aria-current={key === active ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {VIEWS[key].label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
