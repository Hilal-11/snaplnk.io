import { describe, expect, it } from "vitest";
import { safeNext, signupForUrl } from "./safeNext";

describe("safeNext", () => {
  it.each(["/dashboard", "/dashboard/links/new?url=https%3A%2F%2Fx.com", "/dashboard/settings?tab=account"])(
    "allows same-site path %s",
    (p) => expect(safeNext(p)).toBe(p)
  );

  it.each([
    null,
    undefined,
    "",
    "dashboard",
    "//evil.com",
    "/\\evil.com",
    "https://evil.com",
    "javascript:alert(1)",
    "/foo\nbar",
    "/" + "a".repeat(1001),
  ])("falls back for %j", (p) => expect(safeNext(p)).toBe("/dashboard"));

  it("uses a custom fallback", () => expect(safeNext("//x", "/dashboard/links")).toBe("/dashboard/links"));
});

describe("signupForUrl", () => {
  it("round-trips the pasted URL through ?next=", () => {
    const href = signupForUrl("https://example.com/a?b=1&c=2");
    const next = new URL(href, "http://x").searchParams.get("next")!;
    expect(safeNext(next)).toBe(next);
    expect(next.startsWith("/dashboard/links/new?url=")).toBe(true);
    expect(new URLSearchParams(next.split("?")[1]).get("url")).toBe("https://example.com/a?b=1&c=2");
  });
});
