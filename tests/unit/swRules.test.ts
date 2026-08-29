/**
 * Service-worker negative-cache tests (todo.md Task 16a): prove Supabase,
 * Auth, API, and any personal responses are never cached, while versioned
 * static shell assets are. These tests evaluate the exact module the service
 * worker executes (public/sw-rules.js, loaded as a UMD module).
 */

import { describe, expect, it, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type Decision = { mode: "passthrough" | "static" | "shell"; reason: string };
type Rules = { CACHE_NAME: string; decide: (url: string, method: string, mode: string, origin: string) => Decision };

let rules: Rules;
const ORIGIN = "https://owner.github.io";
const BASE = "/ml-prep";

beforeAll(async () => {
  // The UMD module attaches to globalThis under a classic script (the SW
  // path) and to module.exports under Node/vite interop - accept both.
  // The dynamic specifier keeps TS from demanding types for a plain .js file;
  // the runtime shape is asserted immediately below.
  const specifier = `file://${join(process.cwd(), "public", "sw-rules.js")}`;
  const mod = (await import(/* @vite-ignore */ specifier)) as unknown as {
    default?: Rules;
  };
  rules =
    (globalThis as unknown as { swRules?: Rules }).swRules ??
    mod.default ??
    (mod as unknown as Rules);
  expect(rules).toBeDefined();
  expect(typeof rules.decide).toBe("function");
});

describe("requests that must never be cached", () => {
  it("Supabase REST queries (cross-origin) pass through untouched", () => {
    const decision = rules.decide(
      "https://example.supabase.co/rest/v1/tasks?select=%2A&scheduled_date=eq.2026-09-01",
      "GET",
      "cors",
      ORIGIN,
    );
    expect(decision).toEqual({ mode: "passthrough", reason: "cross-origin" });
  });

  it("Supabase auth token refresh (POST, cross-origin) passes through", () => {
    const decision = rules.decide(
      "https://example.supabase.co/auth/v1/token?grant_type=refresh_token",
      "POST",
      "cors",
      ORIGIN,
    );
    expect(decision).toEqual({ mode: "passthrough", reason: "non-get" });
  });

  it("PKCE code exchange callbacks pass through", () => {
    const decision = rules.decide(
      "https://example.supabase.co/auth/v1/callback?code=abc",
      "GET",
      "cors",
      ORIGIN,
    );
    expect(decision.mode).toBe("passthrough");
  });

  it("any cross-origin response is excluded regardless of path", () => {
    const decision = rules.decide("https://cdn.example.net/data.json", "GET", "cors", ORIGIN);
    expect(decision.mode).toBe("passthrough");
  });

  it("same-origin auth and REST paths are excluded as defense in depth", () => {
    for (const path of [
      `${BASE}/auth/v1/user`,
      `${BASE}/rest/v1/tasks?id=eq.1`,
      `${BASE}/realtime/v1/websocket`,
      `${BASE}/storage/v1/object/x`,
    ]) {
      const decision = rules.decide(`${ORIGIN}${path}`, "GET", "cors", ORIGIN);
      expect(decision).toEqual({ mode: "passthrough", reason: "api-path" });
    }
  });

  it("sensitive query parameters block caching even on same-origin paths", () => {
    const decision = rules.decide(`${ORIGIN}${BASE}/?apikey=secret`, "GET", "navigate", ORIGIN);
    expect(decision).toEqual({ mode: "passthrough", reason: "sensitive-param" });
  });

  it("non-GET requests pass through", () => {
    const decision = rules.decide(`${ORIGIN}${BASE}/assets/index-abc.js`, "POST", "cors", ORIGIN);
    expect(decision).toEqual({ mode: "passthrough", reason: "non-get" });
  });
});

describe("requests that form the cached static shell", () => {
  it("hashed static assets use cache-first", () => {
    for (const path of [
      `${BASE}/assets/index-BzDSEkAQ.js`,
      `${BASE}/assets/index-RATtSXpS.css`,
      `${BASE}/icon.svg`,
      `${BASE}/manifest.webmanifest`,
    ]) {
      const decision = rules.decide(`${ORIGIN}${path}`, "GET", "cors", ORIGIN);
      expect(decision.mode, path).toBe("static");
    }
  });

  it("navigations use the network-first shell strategy", () => {
    const decision = rules.decide(`${ORIGIN}${BASE}/`, "GET", "navigate", ORIGIN);
    expect(decision).toEqual({ mode: "shell", reason: "navigation" });
  });

  it("cache name is versioned so stale shells are purged on activate", () => {
    expect(rules.CACHE_NAME).toMatch(/-v\d+$/);
  });

  it("the served sw.js delegates every decision to the tested rules module", () => {
    const sw = readFileSync(join(process.cwd(), "public", "sw.js"), "utf8");
    expect(sw).toContain('importScripts("./sw-rules.js")');
    expect(sw).toContain("self.swRules.decide");
  });
});
