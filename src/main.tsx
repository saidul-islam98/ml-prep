import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { bootstrapApp } from "./auth/bootstrap";
import { queryClient } from "./lib/queryClient";
import "./styles/global.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root is missing from index.html");
}

// Ordering contract (WEBAPP_SPEC.md section 12.1): consume the Supabase PKCE
// `?code=` callback at the root BEFORE hash routing starts, then render.
bootstrapApp()
  .then((result) => {
    createRoot(rootElement).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <App initialAuthError={result.callbackError} />
        </QueryClientProvider>
      </StrictMode>,
    );
  })
  .catch((error: unknown) => {
    // Bootstrap must never leave a blank screen: render the app shell and
    // surface a generic, non-sensitive error.
    console.error("bootstrap failed", error instanceof Error ? error.name : "unknown");
    createRoot(rootElement).render(
      <StrictMode>
        <App initialAuthError="Something went wrong while starting the app. Reload to try again." />
      </StrictMode>,
    );
  });
