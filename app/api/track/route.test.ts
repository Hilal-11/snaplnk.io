import { beforeEach, describe, expect, it, vi } from "vitest";

// --- mocks ---------------------------------------------------------------
const db = vi.hoisted(() => ({
  inserts: [] as { table: string; rows: unknown }[],
  rpcs: [] as { fn: string; args: Record<string, unknown> }[],
  user: null as null | { id: string; email: string; is_anonymous?: boolean; app_metadata: Record<string, unknown> },
  allow: true,
  pending: [] as Promise<unknown>[],
}));

vi.mock("next/server", async (orig) => ({ ...(await orig<typeof import("next/server")>()), after: (fn: () => unknown) => {
  db.pending.push(Promise.resolve(fn()));
} }));
vi.mock("@vercel/functions", () => ({ geolocation: () => ({ country: "IN", city: "Srinagar" }) }));
vi.mock("@/lib/admin/ratelimit", () => ({ rateLimit: async () => db.allow }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: db.user } }) } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  hasServiceRole: () => true,
  createAdminClient: () => ({
    from: (table: string) => ({
      insert: async (rows: unknown) => {
        db.inserts.push({ table, rows });
        return { error: null };
      },
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { value: true } }) }) }),
    }),
    rpc: async (fn: string, args: Record<string, unknown>) => {
      db.rpcs.push({ fn, args });
      return { error: null };
    },
  }),
}));

import { POST as handler } from "./route";

/** Runs the route and waits for its after() background work, like the platform would. */
async function POST(r: Request) {
  const res = await handler(r);
  await Promise.all(db.pending);
  return res;
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const valid = {
  anonymousId: "anon_12345678",
  sessionId: "sess_12345678",
  events: [
    { name: "page_view", path: "/pricing?utm_source=x&utm_campaign=launch", referrer: "https://www.google.com/search", metadata: {} },
    { name: "client_error", path: "/dashboard", metadata: { message: "Boom", stack: "Error: Boom\n    at foo (app.js:1:2)" } },
  ],
};

function req(body: unknown, headers: Record<string, string> = {}) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return new Request("https://snaplnk.io/api/track", {
    method: "POST",
    body: text,
    headers: { "content-type": "application/json", "user-agent": UA, "x-forwarded-for": "203.0.113.9", ...headers },
  });
}

beforeEach(() => {
  db.inserts = [];
  db.rpcs = [];
  db.user = null;
  db.allow = true;
  db.pending = [];
  process.env.ANALYTICS_SALT = "test-salt";
  process.env.ADMIN_EMAILS = "boss@example.com";
});

describe("POST /api/track", () => {
  it("stores a valid batch with hashed IP, geo, UA, UTM and referrer domain", async () => {
    const res = await POST(req(valid));
    expect(res.status).toBe(204);
    const events = db.inserts.find((i) => i.table === "analytics_events")!.rows as Record<string, unknown>[];
    expect(events).toHaveLength(2);
    const [view] = events;
    expect(view).toMatchObject({
      type: "pageview",
      name: "page_view",
      country: "IN",
      city: "Srinagar",
      device: "desktop",
      browser: "Chrome",
      utm_source: "x",
      utm_campaign: "launch",
      referrer_domain: "google.com",
    });
    expect(JSON.stringify(events)).not.toContain("203.0.113.9");
    expect(String(view.ip_hash)).toMatch(/^[a-f0-9]{32}$/);
  });

  it("also files client errors in error_log and touches the session", async () => {
    await POST(req(valid));
    const errors = db.inserts.find((i) => i.table === "error_log")!.rows as Record<string, unknown>[];
    expect(errors[0]).toMatchObject({ message: "Boom", source: "client", path: "/dashboard" });
    expect(db.rpcs[0]).toMatchObject({ fn: "analytics_touch_session", args: { p_id: "sess_12345678", p_pageviews: 1 } });
  });

  it.each([
    ["not JSON", "{oops"],
    ["unknown event name", { ...valid, events: [{ name: "steal_data", metadata: {} }] }],
    ["too many events", { ...valid, events: Array(26).fill({ name: "page_view", path: "/", metadata: {} }) }],
    ["bad anonymous id", { ...valid, anonymousId: "<script>" }],
    ["path not starting with /", { ...valid, events: [{ name: "page_view", path: "https://evil.com", metadata: {} }] }],
    ["nested metadata", { ...valid, events: [{ name: "page_view", path: "/", metadata: { deep: { x: 1 } } }] }],
    ["oversized body", { ...valid, events: [{ name: "page_view", path: "/", metadata: { a: "x".repeat(40_000) } }] }],
  ])("drops %s silently with 204", async (_n, body) => {
    const res = await POST(req(body));
    expect(res.status).toBe(204);
    expect(db.inserts).toHaveLength(0);
  });

  it.each([
    ["bots", { "user-agent": "Googlebot/2.1 (+http://www.google.com/bot.html)" }],
    ["Do Not Track", { dnt: "1" }],
    ["Global Privacy Control", { "sec-gpc": "1" }],
  ])("ignores %s", async (_n, headers) => {
    await POST(req(valid, headers));
    expect(db.inserts).toHaveLength(0);
  });

  it("drops traffic from admins", async () => {
    db.user = { id: "a1", email: "boss@example.com", app_metadata: { role: "ADMIN" } };
    await POST(req(valid));
    expect(db.inserts).toHaveLength(0);
  });

  it("attributes events to signed-in users", async () => {
    db.user = { id: "u1", email: "user@example.com", app_metadata: {} };
    await POST(req(valid));
    const events = db.inserts.find((i) => i.table === "analytics_events")!.rows as Record<string, unknown>[];
    expect(events.every((e) => e.user_id === "u1")).toBe(true);
  });

  it("drops rate-limited clients", async () => {
    db.allow = false;
    await POST(req(valid));
    expect(db.inserts).toHaveLength(0);
  });
});
