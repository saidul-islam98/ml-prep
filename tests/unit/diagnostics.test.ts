/**
 * Diagnostics and export tests (todo.md Task 17): the diagnostic allowlist
 * can never leak error messages, tokens, or user content; the export shape
 * carries owned rows only.
 */

import { describe, expect, it } from "vitest";
import { browserFamily, buildDiagnostic, errorClass, safeRoute } from "../../src/lib/diagnostics";

describe("buildDiagnostic allowlist", () => {
  it("includes only the allowlisted fields", () => {
    const diagnostic = JSON.parse(
      buildDiagnostic({
        error: new Error("boom"),
        route: "/ml-prep/#/today",
        userAgent:
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        now: new Date("2026-08-29T12:00:00Z"),
      }),
    );
    expect(Object.keys(diagnostic).sort()).toEqual([
      "app",
      "browser",
      "errorClass",
      "route",
      "timestamp",
      "version",
    ]);
    expect(diagnostic).toEqual({
      app: "ml-prep",
      version: expect.any(String),
      route: "/ml-prep/#/today",
      errorClass: "Error",
      browser: "Chrome",
      timestamp: "2026-08-29T12:00:00.000Z",
    });
  });

  it("never includes the error message, even when it contains tokens or user content", () => {
    const secret = "Bearer eyJhbGciOiJIUzI1NiJ9.secret.signature";
    const diagnostic = buildDiagnostic({
      error: new Error(`request failed with ${secret} for user secret-note-content`),
      route: "/ml-prep/#/plan?week=3",
      userAgent: "Mozilla/5.0 Firefox/126.0",
      now: new Date("2026-08-29T12:00:00Z"),
    });
    expect(diagnostic).not.toContain("secret");
    expect(diagnostic).not.toContain("Bearer");
    expect(diagnostic).not.toContain("eyJhbGciOiJIUzI1NiJ9");
    expect(diagnostic).not.toContain("request failed");
    // Route query strings are stripped so nothing user-typed leaks.
    expect(diagnostic).not.toContain("week=3");
  });

  it("strips query strings from routes", () => {
    expect(safeRoute("/ml-prep/#/plan?week=3&state=completed")).toBe("/ml-prep/#/plan");
  });

  it("classifies non-Error throwables by constructor name", () => {
    expect(errorClass(new TypeError("x"))).toBe("TypeError");
    expect(errorClass("string thrown")).toBe("string");
    expect(errorClass({ code: 42 })).toBe("Object");
  });

  it("identifies the browser family from the user agent", () => {
    expect(browserFamily("Mozilla/5.0 Edg/126.0")).toBe("Edge");
    expect(browserFamily("Mozilla/5.0 Firefox/126.0")).toBe("Firefox");
    expect(browserFamily("Mozilla/5.0 Safari/605.1.15")).toBe("Safari");
    expect(browserFamily("weird")).toBe("unknown");
  });
});
