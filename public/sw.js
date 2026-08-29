/**
 * Static-shell service worker (WEBAPP_SPEC.md section 14). Strategy decisions
 * live in sw-rules.js (shared with tests). Personal data never enters the
 * cache: Supabase/Auth/API responses are cross-origin passthrough, and
 * same-origin API paths are excluded as defense in depth.
 */

importScripts("./sw-rules.js");

var CACHE = self.swRules.CACHE_NAME;
var SHELL_URLS = ["./", "./manifest.webmanifest", "./icon.svg"];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(function (cache) {
        return cache.addAll(SHELL_URLS);
      })
      .then(function () {
        return self.skipWaiting();
      }),
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) {
              return key !== CACHE;
            })
            .map(function (key) {
              return caches.delete(key);
            }),
        );
      })
      .then(function () {
        return self.clients.claim();
      }),
  );
});

self.addEventListener("fetch", function (event) {
  var decision = self.swRules.decide(
    event.request.url,
    event.request.method,
    event.request.mode,
    self.location.origin,
  );

  if (decision.mode === "passthrough") {
    // Network only; nothing is written to any cache.
    return;
  }

  if (decision.mode === "static") {
    // Cache-first: hashed, immutable static assets.
    event.respondWith(
      caches.match(event.request).then(function (hit) {
        if (hit) return hit;
        return fetch(event.request).then(function (response) {
          if (response.ok) {
            var copy = response.clone();
            caches.open(CACHE).then(function (cache) {
              cache.put(event.request, copy);
            });
          }
          return response;
        });
      }),
    );
    return;
  }

  if (decision.mode === "shell") {
    // Network-first with cache fallback so offline loads show the shell.
    event.respondWith(
      fetch(event.request)
        .then(function (response) {
          if (response.ok) {
            var copy = response.clone();
            caches.open(CACHE).then(function (cache) {
              cache.put(event.request, copy);
            });
          }
          return response;
        })
        .catch(function () {
          return caches
            .match(event.request)
            .then(function (hit) {
              return hit || caches.match("./");
            });
        }),
    );
  }
});
