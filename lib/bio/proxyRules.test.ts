import { describe, expect, it } from "vitest";
import { getAccessRule } from "./proxyRules";

describe("getAccessRule", () => {
  it.each([
    ["/dashboard", "GET", "real-user-page"],
    ["/dashboard/bio-pages", "GET", "real-user-page"],
    ["/dashboard/bio-pages/abc/edit", "GET", "real-user-page"],
    ["/api/bio/pages", "POST", "real-user-api"],
    ["/api/bio/pages/123", "PATCH", "real-user-api"],
    ["/api/bio/pages/123", "DELETE", "real-user-api"],
    ["/api/bio/pages", "GET", "public"], // handler still calls requireRealUser
    ["/api/bio/view", "POST", "public"],
    ["/api/bio/view/", "POST", "public"],
    ["/api/bio/subscribe", "POST", "public"],
    ["/api/bio/viewx", "POST", "real-user-api"],
    ["/bio/hilal", "GET", "public"],
    ["/go/2b1c9a3e-0000-4000-8000-000000000000", "GET", "public"],
    ["/abc1234", "GET", "public"],
    ["/dashboardx", "GET", "public"],
    ["/api/biography", "POST", "public"],
  ] as const)("%s %s -> %s", (path, method, expected) => {
    expect(getAccessRule(path, method)).toBe(expected);
  });
});
