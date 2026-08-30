/**
 * Application shell (Deep-ML Modern Layout & Interview Prep System):
 * Top navigation bar with Deep-ML branding, track switcher, theme toggle (Dark/Light),
 * live connection status, 14-week track timeline context, primary navigation,
 * company track explorer banner, and authentic footer.
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

  const [learnOpen, setLearnOpen] = useState(false);
  const [competeOpen, setCompeteOpen] = useState(false);
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

      {/* Deep-ML Top Navigation Header */}
      <header className="deepml-navbar">
        <div className="deepml-nav-inner">
          <div className="deepml-nav-left">
            <a href="#/today" className="deepml-logo-link" aria-label="Deep-ML Home">
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
              <span className="deepml-logo-text">Deep-ML</span>
              <div className="deepml-brand-tagline">
                <span className="sidebar__eyebrow deepml-kicker-mini">Interview curriculum</span>
                <span className="sidebar__title deepml-logo-badge">Cohere MTS Prep</span>
              </div>
            </a>

            <nav className="sidebar__nav deepml-nav-links" aria-label="Primary">
              <ul className="deepml-nav-links">
                {/* Learn dropdown menu */}
                <li
                  className="deepml-nav-item deepml-dropdown"
                  onMouseEnter={() => setLearnOpen(true)}
                  onMouseLeave={() => setLearnOpen(false)}
                >
                  <a
                    href="#/plan"
                    className="deepml-nav-link"
                    onClick={(e) => {
                      e.preventDefault();
                      setLearnOpen((o) => !o);
                    }}
                  >
                    Learn
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </a>
                  {learnOpen && (
                    <div className="deepml-dropdown-menu">
                      <a
                        href="#/practice"
                        className="deepml-dropdown-item"
                        onClick={() => setLearnOpen(false)}
                      >
                        <svg
                          className="deepml-item-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="m4.5 6.5 1.5 1.5 2.5-3M11.5 7h8m-15 5.5 1.5 1.5 2.5-3m5.5 0h8M6 19h14" />
                        </svg>
                        <div>
                          <div className="deepml-item-title">Problems</div>
                          <div className="deepml-item-sub">30 curated coding & ML challenges</div>
                        </div>
                      </a>
                      <a
                        href="#/plan"
                        className="deepml-dropdown-item"
                        onClick={() => setLearnOpen(false)}
                      >
                        <svg
                          className="deepml-item-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <circle cx="5" cy="20" r="1.8" />
                          <circle cx="11" cy="14" r="1.8" />
                          <circle cx="17" cy="8" r="1.8" />
                          <path d="M5 20h6v-6h6V8" />
                        </svg>
                        <div>
                          <div className="deepml-item-title">Learning Path</div>
                          <div className="deepml-item-sub">
                            14-week guided route through the fundamentals
                          </div>
                        </div>
                      </a>
                      <a
                        href="#/projects"
                        className="deepml-dropdown-item"
                        onClick={() => setLearnOpen(false)}
                      >
                        <svg
                          className="deepml-item-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <rect x="4" y="16.5" width="16" height="4" rx="1" />
                          <rect x="6" y="10.5" width="12" height="4" rx="1" />
                          <rect x="8" y="4.5" width="8" height="4" rx="1" />
                        </svg>
                        <div>
                          <div className="deepml-item-title">Projects</div>
                          <div className="deepml-item-sub">
                            Build an Eval Platform, Agent Sandbox, RLHF Lab
                          </div>
                        </div>
                      </a>
                      <a
                        href="#/practice"
                        className="deepml-dropdown-item"
                        onClick={() => setLearnOpen(false)}
                      >
                        <svg
                          className="deepml-item-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M17 4.5H7l6 7.5-6 7.5h10" />
                        </svg>
                        <div>
                          <div className="deepml-item-title">Mock Interviews</div>
                          <div className="deepml-item-sub">
                            8-dimension rubric scoring & correction loops
                          </div>
                        </div>
                      </a>
                    </div>
                  )}
                </li>

                {/* Primary Nav Links */}
                {(Object.entries(VIEWS) as [ViewKey, (typeof VIEWS)[ViewKey]][]).map(
                  ([key, view]) => (
                    <li key={key} className="deepml-nav-item">
                      <a
                        href={`#${view.path}`}
                        className={
                          key === active
                            ? "app-nav-link deepml-nav-link is-active active"
                            : "app-nav-link deepml-nav-link"
                        }
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

                {/* Compete dropdown menu */}
                <li
                  className="deepml-nav-item deepml-dropdown"
                  onMouseEnter={() => setCompeteOpen(true)}
                  onMouseLeave={() => setCompeteOpen(false)}
                >
                  <a
                    href="#/progress"
                    className="deepml-nav-link"
                    onClick={(e) => {
                      e.preventDefault();
                      setCompeteOpen((o) => !o);
                    }}
                  >
                    Compete
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </a>
                  {competeOpen && (
                    <div className="deepml-dropdown-menu" style={{ minWidth: "260px" }}>
                      <a
                        href="#/progress"
                        className="deepml-dropdown-item"
                        onClick={() => setCompeteOpen(false)}
                      >
                        <svg
                          className="deepml-item-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M4 20h16M5.5 20v-5.5h3.5V20M10.25 20V8.5h3.5V20M15 20v-8.5h3.5V20" />
                        </svg>
                        <div>
                          <div className="deepml-item-title">Contests</div>
                          <div className="deepml-item-sub">Timed challenge rounds</div>
                        </div>
                      </a>
                      <a
                        href="#/progress"
                        className="deepml-dropdown-item"
                        onClick={() => setCompeteOpen(false)}
                      >
                        <svg
                          className="deepml-item-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <circle cx="12" cy="8" r="4.5" />
                          <path d="m12 5.6.9 1.7 1.9.3-1.4 1.4.3 1.9L12 10l-1.7.9.3-1.9-1.4-1.4 1.9-.3Z" />
                        </svg>
                        <div>
                          <div className="deepml-item-title">Leaderboard</div>
                          <div className="deepml-item-sub">Readiness and cohort metrics</div>
                        </div>
                      </a>
                    </div>
                  )}
                </li>
              </ul>
            </nav>
          </div>

          <div className="deepml-nav-right">
            {/* Shimmer 196h Paced Plan button */}
            <a href="#/plan" className="deepml-shimmer-btn">
              196h Plan
            </a>

            {/* Online / Offline status badge */}
            <div className="sidebar__status">
              {!online ? (
                <span
                  className="deepml-live-indicator"
                  style={{
                    color: "var(--warning)",
                    background: "var(--warning-soft)",
                    borderColor: "rgba(245,158,11,0.3)",
                  }}
                >
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
            <span
              className="deepml-live-indicator"
              style={{ background: "transparent", border: "none", padding: 0 }}
            >
              <span className="deepml-pulse-dot" />
              Active Track: <strong>Curriculum Track</strong>
            </span>
            {currentWeek && (
              <span
                className="sidebar__week"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  marginLeft: "var(--space-3)",
                }}
              >
                Week {currentWeek.week_number} · {currentWeek.phase}
              </span>
            )}
          </div>
          <div className="deepml-track-tag-badge">
            <button
              type="button"
              className="deepml-pill"
              onClick={() => setShowTracksBanner((v) => !v)}
              style={{ fontSize: "0.72rem", height: "28px" }}
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
          {/* Deep-ML Company Tracks Explorer Hero Banner (when toggled open) */}
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

        {/* Deep-ML Footer */}
        <footer className="deepml-footer">
          <div className="deepml-footer-inner">
            <div className="deepml-footer-grid">
              <div className="deepml-footer-brand">
                <h3>Deep-ML</h3>
                <p>
                  Company-specific machine learning interview preparation: paced paths, resume
                  projects, mock interviews, and readiness tracking.
                </p>
                <div style={{ marginTop: "var(--space-4)" }}>
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
                <h4>Connect</h4>
                <div className="deepml-social-icons">
                  <a
                    href="https://discord.com/invite/JwMePfMZAV"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="deepml-social-btn"
                    aria-label="Discord"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                  </a>
                  <a
                    href="https://x.com/real_deep_ml"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="deepml-social-btn"
                    aria-label="Twitter / X"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                  <a
                    href="https://www.linkedin.com/company/deep-machine-learning/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="deepml-social-btn"
                    aria-label="LinkedIn"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <div className="deepml-footer-bottom">
              <p>© 2026 Deep-ML. All rights reserved.</p>
              <p style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                Single-user private workspace · Toronto (EST)
              </p>
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
