import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/**
 * The deployed site is served from a GitHub Pages repository subpath
 * (https://<owner>.github.io/<repo>/). The base defaults to /ml-prep/ and can
 * be overridden without code changes via VITE_BASE_PATH when the repository
 * name differs. ADR-0001 documents this decision.
 */
const basePath = process.env.VITE_BASE_PATH ?? "/ml-prep/";

export default defineConfig({
  base: basePath,
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/unit/setup.ts"],
    // Unit/component tests run on `npm test`; integration tests (which need
    // the local Supabase stack) run via `npm run test:integration`.
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    css: false,
  },
});
