import { describe, expect, it } from "vitest";
import { isAdminEmail, parseAdminEmails, ADMIN_SESSION_MAX_AGE_SEC } from "./config";
import { evaluateAdminAccess, roleFor, type AdminCandidate } from "./access";
import { signAdminSession, verifyAdminSession } from "./session";
import { adminRouteRule } from "./proxyRules";

const ADMIN_EMAIL = "admin@example.com";
const list = parseAdminEmails(` ${ADMIN_EMAIL.toUpperCase()} , not-an-email, other@x.io,${ADMIN_EMAIL}`);
const admin: AdminCandidate = { id: "u1", email: ADMIN_EMAIL, email_confirmed_at: "2026-01-01T00:00:00Z" };
const secret = "s".repeat(40);

describe("ADMIN_EMAILS", () => {
  it("parses, lowercases, dedupes and drops junk", () => {
    expect(list).toEqual([ADMIN_EMAIL, "other@x.io"]);
    expect(parseAdminEmails(undefined)).toEqual([]);
  });
  it("matches case-insensitively", () => {
    expect(isAdminEmail("Admin@Example.com", list)).toBe(true);
    expect(isAdminEmail("nope@example.com", list)).toBe(false);
    expect(isAdminEmail(null, list)).toBe(false);
  });
});

describe("roleFor", () => {
  it("promotes only verified, listed, non-anonymous emails", () => {
    expect(roleFor(admin, list)).toBe("ADMIN");
    expect(roleFor({ ...admin, email_confirmed_at: null }, list)).toBe("USER");
    expect(roleFor({ ...admin, is_anonymous: true }, list)).toBe("USER");
    expect(roleFor({ ...admin, email: "someone@else.io" }, list)).toBe("USER");
  });
  it("demotes as soon as the email leaves the list", () => {
    expect(roleFor(admin, [])).toBe("USER");
  });
});

describe("evaluateAdminAccess", () => {
  const base = { user: admin, adminEmails: list, storedRole: "ADMIN", banned: false, sessionValid: true };
  it("allows a verified, listed, promoted admin with a valid session", () => {
    expect(evaluateAdminAccess(base)).toBe("ok");
  });
  it.each([
    ["no user", { user: null }, "unauthenticated"],
    ["not in env list", { adminEmails: [] }, "forbidden"],
    ["unverified email", { user: { ...admin, email_confirmed_at: null } }, "forbidden"],
    ["role not stored as ADMIN", { storedRole: "USER" }, "forbidden"],
    ["role missing", { storedRole: undefined }, "forbidden"],
    ["banned", { banned: true }, "forbidden"],
    ["no admin session", { sessionValid: false }, "reauth"],
  ] as const)("%s → %s", (_n, patch, expected) => {
    expect(evaluateAdminAccess({ ...base, ...patch })).toBe(expected);
  });
});

describe("admin session cookie", () => {
  const now = 1_800_000_000;
  it("verifies a fresh cookie for the same user", async () => {
    const c = await signAdminSession("u1", secret, now);
    expect(await verifyAdminSession(c, "u1", secret, now + 60)).toBe(true);
  });
  it("expires after 7 days", async () => {
    const c = await signAdminSession("u1", secret, now);
    expect(await verifyAdminSession(c, "u1", secret, now + ADMIN_SESSION_MAX_AGE_SEC - 1)).toBe(true);
    expect(await verifyAdminSession(c, "u1", secret, now + ADMIN_SESSION_MAX_AGE_SEC + 1)).toBe(false);
  });
  it("rejects tampering, another user, another secret, garbage and a missing secret", async () => {
    const c = await signAdminSession("u1", secret, now);
    const [uid, ts, sig] = c.split(".");
    expect(await verifyAdminSession(`${uid}.${Number(ts) + 1000}.${sig}`, "u1", secret, now)).toBe(false);
    expect(await verifyAdminSession(c, "u2", secret, now)).toBe(false);
    expect(await verifyAdminSession(c, "u1", "x".repeat(40), now)).toBe(false);
    expect(await verifyAdminSession("a.b", "u1", secret, now)).toBe(false);
    expect(await verifyAdminSession(undefined, "u1", secret, now)).toBe(false);
    expect(await verifyAdminSession(c, "u1", null, now)).toBe(false);
  });
});

describe("adminRouteRule", () => {
  it.each([
    ["/admin", "admin-page"],
    ["/admin/users", "admin-page"],
    ["/admin/login", "admin-login"],
    ["/admin/login/complete", "admin-login"],
    ["/api/admin/users", "admin-api"],
    ["/administrator", null],
    ["/dashboard", null],
  ] as const)("%s → %s", (path, rule) => {
    expect(adminRouteRule(path)).toBe(rule);
  });
});
