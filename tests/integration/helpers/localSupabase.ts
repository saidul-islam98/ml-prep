/**
 * Local Supabase stack discovery for integration tests (todo.md Task 3a).
 *
 * Credentials are read from `npx supabase status -o env` at runtime - never
 * hardcoded and never committed. These keys are the well-known local
 * development keys of this machine's isolated stack; production keys must
 * never appear in this repository or its tests.
 */

import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export interface LocalSupabaseEnv {
  apiUrl: string;
  dbUrl: string;
  publishableKey: string;
  anonKey: string;
  serviceRoleKey: string;
  mailpitUrl: string;
}

let cached: LocalSupabaseEnv | null = null;

export function getLocalSupabaseEnv(): LocalSupabaseEnv {
  if (cached) return cached;

  let output: string;
  try {
    output = execFileSync(supabaseBin(), ["status", "-o", "env"], {
      cwd: repoRoot(),
      encoding: "utf8",
      timeout: 60_000,
    });
  } catch (error) {
    throw new Error(
      "Local Supabase stack is not running. Start it with: npm run supabase:start\n" +
        `Underlying error: ${String(error)}`,
    );
  }

  const vars = new Map<string, string>();
  for (const line of output.split("\n")) {
    const match = /^([A-Z0-9_]+)="?([^"\n]*)"?$/.exec(line.trim());
    if (match) vars.set(match[1], match[2]);
  }

  const apiUrl = vars.get("SUPABASE_URL") ?? vars.get("API_URL");
  const dbUrl = vars.get("SUPABASE_DB_URL") ?? vars.get("DB_URL");
  const publishableKey = vars.get("SUPABASE_PUBLISHABLE_KEY") ?? vars.get("PUBLISHABLE_KEY");
  const anonKey = vars.get("SUPABASE_ANON_KEY") ?? vars.get("ANON_KEY");
  const serviceRoleKey = vars.get("SUPABASE_SERVICE_ROLE_KEY") ?? vars.get("SERVICE_ROLE_KEY");
  const mailpitUrl = vars.get("MAILPIT_URL") ?? vars.get("INBUCKET_URL") ?? "";

  if (!apiUrl || !dbUrl || !publishableKey || !anonKey || !serviceRoleKey) {
    throw new Error(
      `Could not parse supabase status output. Got keys: ${[...vars.keys()].join(", ")}`,
    );
  }

  cached = { apiUrl, dbUrl, publishableKey, anonKey, serviceRoleKey, mailpitUrl };
  return cached;
}

function repoRoot(): string {
  // tests/integration/helpers -> repo root is three levels up.
  return fileURLToPath(new URL("../../../", import.meta.url));
}

/** Absolute path of the repo-local supabase CLI binary. */
function supabaseBin(): string {
  return join(repoRoot(), "node_modules", ".bin", "supabase");
}
