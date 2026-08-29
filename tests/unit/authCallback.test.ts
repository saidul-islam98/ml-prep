import { describe, expect, it } from "vitest";
import { inspectCallback, postCallbackUrl, redirectUrl } from "../../src/auth/authCallback";

describe("inspectCallback", () => {
  it("detects a PKCE code callback", () => {
    expect(inspectCallback("?code=abc123")).toEqual({ hasCode: true, hasError: false });
  });

  it("ignores an unrelated query string", () => {
    expect(inspectCallback("?utm_source=mail")).toEqual({ hasCode: false, hasError: false });
    expect(inspectCallback("")).toEqual({ hasCode: false, hasError: false });
  });

  it("surfaces provider errors without leaking free-form content", () => {
    const result = inspectCallback(
      "?error=access_denied&error_code=404&error_description=not+allowed",
    );
    expect(result.hasError).toBe(true);
    expect(result.error).toEqual({ code: "404", description: "not allowed" });
  });
});

describe("postCallbackUrl", () => {
  it("keeps pathname and hash, drops the query", () => {
    expect(postCallbackUrl("/ml-prep/", "#/today")).toBe("/ml-prep/#/today");
    expect(postCallbackUrl("/ml-prep/", "")).toBe("/ml-prep/");
  });
});

describe("redirectUrl", () => {
  it("builds the exact Pages-root redirect for PKCE", () => {
    expect(redirectUrl("https://owner.github.io", "/ml-prep/")).toBe(
      "https://owner.github.io/ml-prep/",
    );
    expect(redirectUrl("http://localhost:5173", "/")).toBe("http://localhost:5173/");
  });

  it("normalizes a base without trailing slash", () => {
    expect(redirectUrl("https://owner.github.io", "/ml-prep")).toBe(
      "https://owner.github.io/ml-prep/",
    );
  });
});
