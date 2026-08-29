/**
 * Supabase client factory (WEBAPP_SPEC.md section 12.2). The URL and
 * publishable key are public build identifiers, not secrets; RLS plus the
 * database command boundary is the security boundary.
 *
 * PKCE is the auth flow; the `?code=` callback is consumed explicitly by
 * src/auth/bootstrap.ts before hash routing starts (detectSessionInUrl is
 * disabled here so ordering stays deterministic).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export class SupabaseConfigError extends Error {
  constructor() {
    super(
      "Supabase URL or publishable key is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY at build time.",
    );
    this.name = "SupabaseConfigError";
  }
}

/** True when build-time Supabase identifiers are present. */
export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  return Boolean(url && key);
}

/** Create (or reuse) the application Supabase client. */
export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (!url || !key) throw new SupabaseConfigError();

  client = createClient(url, key, {
    auth: {
      flowType: "pkce",
      // The callback is consumed before routing starts; see bootstrap.
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return client;
}
