/**
 * Service-worker routing rules (todo.md Task 16a; WEBAPP_SPEC.md section 14).
 *
 * Written as a UMD module so the classic-script service worker can consume
 * it via importScripts AND Node tests can evaluate the exact same decisions:
 *
 *   - Non-GET requests are never intercepted (passthrough).
 *   - Cross-origin requests are never intercepted: Supabase/Auth/API run on
 *     a different origin in production, so personal responses can never
 *     enter the cache.
 *   - Same-origin auth/api/realtime/storage paths are excluded as defense in
 *     depth (e.g. a misconfigured same-origin Supabase in local dev).
 *   - Navigations use a network-first shell strategy with a cache fallback.
 *   - Versioned static assets use cache-first (immutable hashed names).
 *
 * Personal data is only ever in Supabase responses, which are passthrough:
 * the cache holds the static shell alone.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.swRules = factory();
  }
})(typeof self !== "undefined" ? self : globalThis, function () {
  "use strict";

  var CACHE_NAME = "ml-prep-static-v1";

  // Defense-in-depth: excluded even when same-origin (local Supabase runs
  // same-origin in some dev setups).
  var NEVER_CACHE_PATHS = ["/auth/", "/rest/", "/realtime/", "/storage/", "/functions/", "/pg/"];

  var NEVER_CACHE_PARAMS = ["apikey", "token", "code"];

  var STATIC_EXTENSIONS = [
    ".js",
    ".mjs",
    ".css",
    ".woff2",
    ".woff",
    ".png",
    ".jpg",
    ".jpeg",
    ".svg",
    ".webp",
    ".ico",
    ".webmanifest",
    ".txt",
    ".json",
  ];

  function endsWithAny(path, suffixes) {
    for (var i = 0; i < suffixes.length; i += 1) {
      if (path.slice(-suffixes[i].length) === suffixes[i]) return true;
    }
    return false;
  }

  function includesAny(path, needles) {
    for (var i = 0; i < needles.length; i += 1) {
      if (path.indexOf(needles[i]) !== -1) return true;
    }
    return false;
  }

  /**
   * Decide the fetch strategy for a request.
   * @param {string} requestUrl absolute request URL
   * @param {string} method HTTP method
   * @param {string} requestMode Request.mode ("navigate", "cors", ...)
   * @param {string} swOrigin the service worker's own origin
   * @returns {{mode: "passthrough"|"static"|"shell", reason: string}}
   */
  function decide(requestUrl, method, requestMode, swOrigin) {
    var url = new URL(requestUrl);

    if (method !== "GET") {
      return { mode: "passthrough", reason: "non-get" };
    }

    if (url.origin !== swOrigin) {
      return { mode: "passthrough", reason: "cross-origin" };
    }

    var path = url.pathname;
    if (includesAny(path, NEVER_CACHE_PATHS)) {
      return { mode: "passthrough", reason: "api-path" };
    }
    for (var i = 0; i < NEVER_CACHE_PARAMS.length; i += 1) {
      if (url.searchParams.has(NEVER_CACHE_PARAMS[i])) {
        return { mode: "passthrough", reason: "sensitive-param" };
      }
    }

    if (requestMode === "navigate") {
      return { mode: "shell", reason: "navigation" };
    }

    if (endsWithAny(path, STATIC_EXTENSIONS) || path === "/" || endsWithAny(path, ["/"])) {
      return { mode: "static", reason: "static-asset" };
    }

    return { mode: "passthrough", reason: "unrecognized" };
  }

  return { CACHE_NAME: CACHE_NAME, decide: decide };
});
