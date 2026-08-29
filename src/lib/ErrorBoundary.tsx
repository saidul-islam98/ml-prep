/**
 * Global error boundary (WEBAPP_SPEC.md section 16): renders a recovery
 * screen with a copy-to-clipboard diagnostic containing only allowlisted
 * fields. Error messages are deliberately NOT included: they may contain
 * user content or sensitive fragments.
 */

import { Component, type ErrorInfo, type ReactNode } from "react";
import { buildDiagnostic } from "../lib/diagnostics";

interface ErrorBoundaryState {
  diagnostic: string | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { diagnostic: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      diagnostic: buildDiagnostic({
        error,
        route: `${window.location.pathname}${window.location.hash}`,
        userAgent: navigator.userAgent,
      }),
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Local-only capture; no hosted error tracking in MVP.
    console.error("ui error", error.name, info.componentStack ? "with stack" : "no stack");
  }

  render(): ReactNode {
    if (this.state.diagnostic === null) {
      return this.props.children;
    }
    return (
      <div className="app-shell">
        <main className="app-main" id="main">
          <section aria-labelledby="error-title" className="placeholder">
            <h1 id="error-title">Something went wrong</h1>
            <p>
              The app hit an unexpected error. Reload to recover; your saved data is on the server
              and unaffected.
            </p>
            <div className="task-actions">
              <button type="button" onClick={() => window.location.reload()}>
                Reload
              </button>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(this.state.diagnostic ?? "");
                }}
              >
                Copy diagnostic
              </button>
            </div>
            <details>
              <summary>Diagnostic (allowlisted fields only)</summary>
              <pre className="diagnostic-preview">{this.state.diagnostic}</pre>
            </details>
          </section>
        </main>
      </div>
    );
  }
}
