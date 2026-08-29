import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  parseHash,
  currentPath,
  navigate,
  ensureDefaultRoute,
  type Route,
} from "../../src/router/hashRouter";

describe("parseHash", () => {
  it("returns today for an empty hash", () => {
    expect(parseHash("")).toEqual<Route>({ path: "/today" });
  });

  it("returns today for a bare hash", () => {
    expect(parseHash("#")).toEqual<Route>({ path: "/today" });
  });

  it("returns today for a bare slash hash", () => {
    expect(parseHash("#/")).toEqual<Route>({ path: "/today" });
  });

  it("parses a simple view path", () => {
    expect(parseHash("#/plan")).toEqual<Route>({ path: "/plan" });
  });

  it("parses a path with a single parameter", () => {
    expect(parseHash("#/projects/proj-1")).toEqual<Route>({
      path: "/projects/proj-1",
    });
  });

  it("parses a path with a query string", () => {
    expect(parseHash("#/plan?week=3&state=completed")).toEqual<Route>({
      path: "/plan",
      query: new URLSearchParams({ week: "3", state: "completed" }),
    });
  });

  it("decodes percent-encoded path segments", () => {
    expect(parseHash("#/tasks/custom%20task")).toEqual<Route>({
      path: "/tasks/custom task",
    });
  });

  it("normalizes a missing leading slash", () => {
    expect(parseHash("#plan")).toEqual<Route>({ path: "/plan" });
  });

  it("does not treat a query-looking hash as a path", () => {
    // "#/?x=1" is the today view with a query, not a view named "?x".
    expect(parseHash("#/?x=1").path).toBe("/today");
  });
});

describe("currentPath and navigate", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.stubGlobal("location", new URL("https://example.github.io/ml-prep/"));
    vi.stubGlobal("history", {
      replaceState: vi.fn(),
      pushState: vi.fn(),
    });
    vi.stubGlobal("dispatchEvent", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    void originalLocation;
  });

  it("reads the current path from location.hash", () => {
    (window.location as unknown as URL).hash = "#/projects";
    expect(currentPath()).toBe("/projects");
  });

  it("defaults to /today when no hash is present", () => {
    (window.location as unknown as URL).hash = "";
    expect(currentPath()).toBe("/today");
  });

  it("navigate writes a hash and dispatches hashchange", () => {
    navigate("/practice");
    expect(window.location.hash).toBe("#/practice");
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "hashchange" }),
    );
  });
});

describe("ensureDefaultRoute", () => {
  beforeEach(() => {
    vi.stubGlobal("location", new URL("https://example.github.io/ml-prep/"));
    vi.stubGlobal("history", { replaceState: vi.fn(), pushState: vi.fn() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("replaces an empty hash with #/today using history.replaceState", () => {
    (window.location as unknown as URL).hash = "";
    ensureDefaultRoute();
    expect(window.history.replaceState).toHaveBeenCalledWith(null, "", "#/today");
  });

  it("leaves an existing route untouched", () => {
    (window.location as unknown as URL).hash = "#/readiness";
    ensureDefaultRoute();
    expect(window.history.replaceState).not.toHaveBeenCalled();
  });
});
