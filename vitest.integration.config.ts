import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Integration-test config: runs ONLY tests/integration against the local
 * Supabase stack (start it first: npm run supabase:start). Node environment,
 * no jsdom or DOM setup needed for database/auth tests. Standalone rather
 * than merged so the unit-test include pattern is fully replaced.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
    setupFiles: [],
    include: ["tests/integration/**/*.test.{ts,tsx}"],
    // Integration tests share one local database; run files sequentially.
    fileParallelism: false,
  },
});
