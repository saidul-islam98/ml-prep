import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/global.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root is missing from index.html");
}

// PKCE note (WEBAPP_SPEC.md §12.1): the Supabase `?code=` callback at the root
// query is consumed before hash routing starts. Task 5 introduces that logic;
// hash routing below must remain strictly after it.
startApp(rootElement);

function startApp(root: HTMLElement): void {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
