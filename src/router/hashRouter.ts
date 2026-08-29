/**
 * Minimal hash-based router for GitHub Pages subpath hosting.
 *
 * Hash routing is a product requirement (WEBAPP_SPEC.md §6): direct navigation
 * must work on GitHub Pages without server rewrites, and the Supabase PKCE
 * callback at the root `?code=` query must be consumed before hash routing
 * starts. Keeping this module dependency-free keeps that ordering explicit.
 */

export interface Route {
  path: string;
  query?: URLSearchParams;
}

const DEFAULT_PATH = "/today";

/** Parse a location hash such as `#/plan?week=3` into a Route. */
export function parseHash(hash: string): Route {
  // Strip a leading "#" (and tolerate "#/x" vs "#x" vs "#").
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (raw === "" || raw === "/") {
    return { path: DEFAULT_PATH };
  }

  const withoutQuery = raw.split("?")[0] ?? "";
  const rawPath = withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
  let path = rawPath;
  try {
    path = decodeURIComponent(rawPath);
  } catch {
    // Malformed percent-encoding: keep the raw path rather than throwing.
  }

  if (path === "/") {
    return { path: DEFAULT_PATH };
  }

  const route: Route = { path };
  const queryStart = raw.indexOf("?");
  if (queryStart !== -1) {
    route.query = new URLSearchParams(raw.slice(queryStart + 1));
  }
  return route;
}

/** The current route path (never empty; defaults to /today). */
export function currentPath(): string {
  return parseHash(window.location.hash).path;
}

/** Navigate to an in-app path by writing the location hash. */
export function navigate(path: string): void {
  const target = path.startsWith("/") ? path : `/${path}`;
  window.location.hash = `#${target}`;
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

/**
 * On first load, replace an empty hash with the default route so the URL
 * always shows a concrete view. Uses replaceState: the empty-hash load is not
 * a navigation the user performed.
 */
export function ensureDefaultRoute(): void {
  if (
    window.location.hash === "" ||
    window.location.hash === "#" ||
    window.location.hash === "#/"
  ) {
    window.history.replaceState(null, "", `#${DEFAULT_PATH}`);
  }
}
