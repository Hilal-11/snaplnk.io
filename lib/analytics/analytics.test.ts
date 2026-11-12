import { describe, expect, it } from "vitest";
import { dailySalt, hashIp, visitorHash } from "./hash";
import { domainOf, trackBatchSchema, utmFrom } from "./events";
import { errorFingerprint } from "./server";

describe("IP hashing", () => {
  const d1 = new Date("2026-11-14T10:00:00Z");
  const d2 = new Date("2026-11-15T10:00:00Z");
  it("never returns the IP and rotates daily", () => {
    const h1 = hashIp("203.0.113.9", d1, "salt")!;
    expect(h1).not.toContain("203");
    expect(hashIp("203.0.113.9", d1, "salt")).toBe(h1);
    expect(hashIp("203.0.113.9", d2, "salt")).not.toBe(h1);
    expect(dailySalt(d1, "salt")).not.toBe(dailySalt(d2, "salt"));
  });
  it("depends on the secret and ignores missing IPs", () => {
    expect(hashIp("1.1.1.1", d1, "a")).not.toBe(hashIp("1.1.1.1", d1, "b"));
    expect(hashIp(null, d1, "salt")).toBeNull();
  });
  it("visitor hash is stable and keyed", () => {
    expect(visitorHash("1.1.1.1", "ua", "k")).toBe(visitorHash("1.1.1.1", "ua", "k"));
    expect(visitorHash("1.1.1.1", "ua", "k")).not.toBe(visitorHash("1.1.1.1", "ua", "other"));
  });
});

describe("helpers", () => {
  it("parses UTM params and referrer domains", () => {
    expect(utmFrom("/?utm_source=tw&utm_medium=social")).toEqual({ utm_source: "tw", utm_medium: "social", utm_campaign: null });
    expect(domainOf("https://www.google.com/x")).toBe("google.com");
    expect(domainOf("not a url")).toBeNull();
  });
  it("groups errors that differ only by numbers", () => {
    expect(errorFingerprint("Item 12 failed", "at x (a.js:10:5)")).toBe(errorFingerprint("Item 99 failed", "at x (a.js:11:2)"));
    expect(errorFingerprint("A", "at x")).not.toBe(errorFingerprint("B", "at x"));
  });
  it("defaults metadata and accepts a minimal valid batch", () => {
    const r = trackBatchSchema.parse({ anonymousId: "abcdefgh", sessionId: "abcdefgh", events: [{ name: "page_view", path: "/" }] });
    expect(r.events[0].metadata).toEqual({});
  });
});
