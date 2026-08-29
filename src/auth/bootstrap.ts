/**
 * Application bootstrap (WEBAPP_SPEC.md section 12.1): the Supabase PKCE
 * `?code=` callback at the root is consumed BEFORE hash routing starts, then
 * removed from history, and only then does the app render and route.
 */

import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabaseClient";
import { inspectCallback, postCallbackUrl } from "./authCallback";

export interface BootstrapResult {
  callbackError?: string;
}

export interface CodeExchanger {
  exchangeCodeForSession: (url: string) => Promise<{ error: { message: string } | null }>;
}

/**
 * Consume a PKCE callback if present. Safe to run unconditionally at startup.
 * `exchanger` defaults to the application Supabase client; tests inject a
 * double to keep this pure.
 */
export async function consumeAuthCallback(
  location: Pick<Location, "search" | "pathname" | "hash">,
  history: Pick<History, "replaceState">,
  exchanger?: CodeExchanger,
): Promise<BootstrapResult> {
  const callback = inspectCallback(location.search);
  if (!callback.hasCode && !callback.hasError) return {};

  if (callback.hasCode) {
    const supabase = exchanger ?? getSupabaseClient().auth;
    // Pass only the authorization code: auth-js resolves the PKCE verifier
    // from its storage. (The provider's redirect does not echo a flow id,
    // and appending one to emailRedirectTo would break the exact redirect
    // allowlist on Supabase.)
    const code = new URLSearchParams(location.search).get("code") ?? "";
    const { error } = await supabase.exchangeCodeForSession(code);
    if (error) {
      const result: BootstrapResult = {
        callbackError: "The sign-in link was invalid or has expired. Request a new one.",
      };
      history.replaceState(null, "", postCallbackUrl(location.pathname, location.hash));
      return result;
    }
  }

  history.replaceState(null, "", postCallbackUrl(location.pathname, location.hash));
  return callback.hasError
    ? { callbackError: "The sign-in redirect failed. Request a new sign-in link." }
    : {};
}

/** Full entry-point bootstrap: callback, then default hash route. */
export async function bootstrapApp(): Promise<BootstrapResult> {
  if (!isSupabaseConfigured()) {
    // Misconfigured deployment: the app still renders an explanatory state
    // via the App-level config check. Nothing auth-related can run.
    return {};
  }
  const result = await consumeAuthCallback(window.location, window.history);
  return result;
}
