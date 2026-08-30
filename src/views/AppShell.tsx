/**
 * Application shell (ML Prep Layout & Interview Prep System):
 * Top navigation bar with branding, track switcher, theme toggle (Dark/Light),
 * live connection status, 14-week track timeline context, primary navigation,
 * company track explorer banner, and footer.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { VIEWS, type ViewKey } from "./views";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { CompanyTracksExplorer } from "../components/CompanyTracksExplorer";

const PRIMARY_KEYS: ViewKey[] = ["today", "plan", "projects", "practice"];
const MORE_KEYS: ViewKey[] = ["readiness", "progress", "settings"];

interface AppShellProps {
  active: ViewKey;
  currentWeek?: { week_number: number; phase: string } | null;
  children: ReactNode;
}

export function AppShell({ active, currentWeek, children }: AppShellProps) {
  const online = useOnlineStatus();
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    const saved = localStorage.getItem("user-theme");
    return saved === "light" ? "light" : "dark";
  });

  const [showTracksBanner, setShowTracksBanner] = useState(false);

  // Sync theme changes with documentElement
  useEffect(() => {
    try {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(theme);
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("user-theme", theme);
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  return (
    <div className="app-shell" data-offline={!online}>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      {/* Top Navigation Header */}
      <header className="deepml-navbar">
        <div className="deepml-nav-inner">
          <div className="deepml-nav-left">
            <a href="#/today" className="deepml-logo-link" aria-label="Cohere MTS Prep Home">
              <div className="deepml-logo-icon" aria-hidden="true">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="deepml-logo-text">ML Prep</span>
              <div className="deepml-brand-tagline">
                <span className="sidebar__eyebrow deepml-kicker-mini">Interview curriculum</span>
                <span className="sidebar__title deepml-logo-badge">Cohere MTS Prep</span>
              </div>
            </a>

            <nav className="sidebar__nav deepml-nav-links" aria-label="Primary">
              <ul className="deepml-nav-links">
                {/* Primary Nav Links */}
                {(Object.entries(VIEWS) as [ViewKey, (typeof VIEWS)[ViewKey]][]).map(
                  ([key, view]) => (
                    <li key={key} className="deepml-nav-item">
                      <a
                        href={`#${view.path}`}
                        className={key === active ? "deepml-nav-link is-active" : "deepml-nav-link"}
                        aria-current={key === active ? "page" : undefined}
                      >
                        {view.label}
                        {key === active && (
                          <span className="deepml-active-bar" aria-hidden="true" />
                        )}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </nav>
          </div>

          <div className="deepml-nav-right">
            {/* Shimmer 196h Paced Plan button */}
            <a href="#/plan" className="deepml-shimmer-btn">
              196h Plan
            </a>

            {/* Online / Offline status badge */}
            <div className="deepml-status-wrap">
              {!online ? (
                <span className="deepml-live-indicator deepml-offline-indicator">
                  <span className="deepml-pulse-dot deepml-pulse-dot--warning" />
                  Offline - read-only
                </span>
              ) : (
                <span className="deepml-live-indicator">
                  <span className="deepml-pulse-dot" />
                  Online
                </span>
              )}
            </div>

            {/* Dark / Light Theme Toggle Button */}
            <button
              type="button"
              className="deepml-theme-toggle"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onClick={toggleTheme}
            >
              {theme === "dark" ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Subnavigation Bar for Active Track Timeline & Modules */}
      <div className="deepml-subnav" role="region" aria-label="Track Status and Controls">
        <div className="deepml-subnav-inner">
          <div className="deepml-subnav-track-info">
            <span className="deepml-live-indicator deepml-subnav-live">
              <span className="deepml-pulse-dot" />
              Active Track: <strong>Curriculum Track</strong>
            </span>
            {currentWeek && (
              <span className="deepml-week-tag">
                Week {currentWeek.week_number} · {currentWeek.phase}
              </span>
            )}
          </div>
          <div className="deepml-track-tag-badge">
            <button
              type="button"
              className="deepml-pill deepml-pill--sm"
              onClick={() => setShowTracksBanner((v) => !v)}
            >
              {showTracksBanner
                ? "Hide Tracks Explorer"
                : "✦ Company Tracks (Anthropic, OpenAI, DeepMind...)"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="app-column">
        {!online && (
          <p role="status" className="task-offline shell-offline">
            <span>⚠</span>
            <span>
              You are offline. Saved data remains visible, but editing is disabled until you
              reconnect.
            </span>
          </p>
        )}

        <main className="app-main" id="main">
          {/* Company Tracks Explorer Hero Banner (when toggled open) */}
          {showTracksBanner && (
            <CompanyTracksExplorer
              currentWeek={currentWeek}
              onSelectTrack={() => {
                setShowTracksBanner(false);
                window.location.hash = "#/today";
              }}
            />
          )}

          <fieldset className="app-content" disabled={!online} aria-disabled={!online}>
            {children}
          </fieldset>
        </main>

        {/* Footer */}
        <footer className="deepml-footer">
          <div className="deepml-footer-inner">
            <div className="deepml-footer-grid">
              <div className="deepml-footer-brand">
                <h3>Cohere MTS Prep</h3>
                <p>
                  Specialized machine learning interview preparation: paced curriculum, verifiable
                  capstone projects, timed mocks, and evidence-based readiness tracking.
                </p>
                <div className="deepml-footer-badge-row">
                  <span className="deepml-kicker-badge">MTS Curriculum · 14 Weeks · 196 Hours</span>
                </div>
              </div>

              <div className="deepml-footer-col">
                <h4>Quick Links</h4>
                <ul className="deepml-footer-links">
                  <li>
                    <a href="#/today">Today's Tasks</a>
                  </li>
                  <li>
                    <a href="#/plan">14-Week Learning Path</a>
                  </li>
                  <li>
                    <a href="#/projects">Resume Projects</a>
                  </li>
                  <li>
                    <a href="#/practice">Coding & Mocks</a>
                  </li>
                  <li>
                    <a href="#/readiness">Readiness Matrix</a>
                  </li>
                  <li>
                    <a href="#/progress">Progress Analytics</a>
                  </li>
                  <li>
                    <a href="#/settings">Settings & Reminder</a>
                  </li>
                </ul>
              </div>

              <div className="deepml-footer-col">
                <h4>Resources</h4>
                <ul className="deepml-footer-links">
                  <li>
                    <a href="https://cohere.com/careers" target="_blank" rel="noopener noreferrer">
                      Cohere Careers ↗
                    </a>
                  </li>
                  <li>
                    <a href="https://docs.cohere.com/" target="_blank" rel="noopener noreferrer">
                      Cohere Platform Docs ↗
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://github.com/saidul-islam98/ml-prep"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ML Prep Repository ↗
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="deepml-footer-bottom">
              <p>© 2026 Cohere MTS Prep. All rights reserved.</p>
              <p className="deepml-footer-meta">Single-user private workspace · Toronto (EST)</p>
            </div>
          </div>
        </footer>

        {/* Mobile Bottom Navigation */}
        <nav className="deepml-mobile-bottombar" aria-label="Mobile">
          <ul>
            {PRIMARY_KEYS.map((key) => (
              <li key={key}>
                <a
                  href={`#${VIEWS[key].path}`}
                  className={key === active ? "active" : ""}
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
        className={anyMoreActive ? "deepml-mobile-more-btn active" : "deepml-mobile-more-btn"}
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
