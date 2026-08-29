/**
 * PKCE callback handling (todo.md Task 5; WEBAPP_SPEC.md section 12.1).
 *
 * The Supabase Auth PKCE redirect lands on the application root with a
 * `?code=` query parameter. It MUST be consumed before hash routing starts,
 * then stripped from history so the URL is clean and reload-safe.
 */

export interface CallbackResult {
  /** True when the current location carries a PKCE authorization code. */
  hasCode: boolean;
  /** True when the provider redirected back with an error. */
  hasError: boolean;
  /** Provider error code/description when present. */
  error?: { code: string; description: string };
}

const SUPABASE_ERROR_PARAM = "error";
const SUPABASE_ERROR_DESCRIPTION_PARAM = "error_description";
const SUPABASE_ERROR_CODE_PARAM = "error_code";

/** Inspect a location.search string for a PKCE callback or auth error. */
export function inspectCallback(search: string): CallbackResult {
  const params = new URLSearchParams(search);
  const code = params.get("code");
  const error = params.get(SUPABASE_ERROR_PARAM);
  if (error) {
    return {
      hasCode: code !== null,
      hasError: true,
      error: {
        code: params.get(SUPABASE_ERROR_CODE_PARAM) ?? error,
        description:
          params.get(SUPABASE_ERROR_DESCRIPTION_PARAM) ?? "Authentication redirect failed.",
      },
    };
  }
  return { hasCode: code !== null, hasError: false };
}

/**
 * The URL to strip to after a callback is consumed: keeps the pathname
 * (including the Pages subpath) and the hash, drops the whole query string.
 */
export function postCallbackUrl(pathname: string, hash: string): string {
  return `${pathname}${hash || ""}`;
}

/** The exact redirect URL used for sign-in on this deployment. */
export function redirectUrl(origin: string, basePath: string): string {
  const base = basePath.startsWith("/") ? basePath : `/${basePath}`;
  return `${origin}${base.endsWith("/") ? base : `${base}/`}`;
}
