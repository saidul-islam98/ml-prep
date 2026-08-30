import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { ErrorBoundary } from "./lib/ErrorBoundary";
import { bootstrapApp } from "./auth/bootstrap";
import { queryClient } from "./lib/queryClient";
import "./styles/tokens.css";
import "./styles/primitives.css";
import "./styles/global.css";
import "./styles/shell.css";
import "./styles/resources.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root is missing from index.html");
}

// Ordering contract (WEBAPP_SPEC.md section 12.1): consume the Supabase PKCE
// `?code=` callback at the root BEFORE hash routing starts, then render.
// PWA: register the static-shell service worker in production builds only.
// It caches versioned static assets only (see public/sw-rules.js and its
// negative-cache tests); Supabase/Auth/API responses are never intercepted.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch((error: unknown) => {
        console.error("sw registration failed", error instanceof Error ? error.name : "unknown");
      });
  });
}

bootstrapApp()
  .then((result) => {
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <App initialAuthError={result.callbackError} />
          </QueryClientProvider>
        </ErrorBoundary>
      </StrictMode>,
    );
  })
  .catch((error: unknown) => {
    // Bootstrap must never leave a blank screen: render the app shell and
    // surface a generic, non-sensitive error.
    console.error("bootstrap failed", error instanceof Error ? error.name : "unknown");
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <App initialAuthError="Something went wrong while starting the app. Reload to try again." />
        </ErrorBoundary>
      </StrictMode>,
    );
  });
