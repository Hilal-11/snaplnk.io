import { beforeEach, describe, expect, it, vi } from "vitest";

// --- mocks ---------------------------------------------------------------
const state = vi.hoisted(() => ({
  user: null as null | { id: string; email: string; email_confirmed_at: string | null; app_metadata: Record<string, unknown> },
  access: null as null | { role: "ADMIN" | "USER"; banned: boolean },
  cookie: undefined as string | undefined,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.user } }) } }),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => (state.cookie ? { value: state.cookie } : undefined) }),
}));
vi.mock("./sync", () => ({ readUserAccess: async () => state.access }));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));

import { requireAdmin, requireAdminAction, requireAdminApi } from "./requireAdmin";
import { signAdminSession } from "./session";

const SECRET = "k".repeat(48);
const ADMIN = { id: "admin-1", email: "boss@example.com", email_confirmed_at: "2026-01-01T00:00:00Z", app_metadata: { role: "ADMIN" } };

beforeEach(async () => {
  process.env.ADMIN_EMAILS = "boss@example.com";
  process.env.ADMIN_SESSION_SECRET = SECRET;
  state.user = ADMIN;
  state.access = { role: "ADMIN", banned: false };
  state.cookie = await signAdminSession(ADMIN.id, SECRET);
});

describe("requireAdmin()", () => {
  it("returns the admin user when everything checks out", async () => {
    await expect(requireAdmin()).resolves.toMatchObject({ id: ADMIN.id });
  });
  it("sends signed-out visitors to /admin/login", async () => {
    state.user = null;
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/admin/login");
  });
  it("sends non-admins home", async () => {
    state.user = { ...ADMIN, id: "u2", email: "user@example.com" };
    state.access = { role: "USER", banned: false };
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/");
  });
  it("re-checks the env list on every call (removal is immediate)", async () => {
    process.env.ADMIN_EMAILS = "";
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/");
  });
  it("blocks banned admins", async () => {
    state.access = { role: "ADMIN", banned: true };
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/");
  });
  it("requires a valid admin session cookie", async () => {
    state.cookie = undefined;
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/admin/login");
    state.cookie = await signAdminSession("someone-else", SECRET);
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/admin/login");
  });
  it("fails closed without ADMIN_SESSION_SECRET", async () => {
    delete process.env.ADMIN_SESSION_SECRET;
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/admin/login");
  });
});

describe("requireAdminApi() / requireAdminAction()", () => {
  it("lets admins through", async () => {
    const r = await requireAdminApi();
    expect(r.ok).toBe(true);
    await expect(requireAdminAction()).resolves.toMatchObject({ id: ADMIN.id });
  });
  it("answers a bare 404 to everyone else", async () => {
    state.user = { ...ADMIN, email: "user@example.com" };
    const r = await requireAdminApi();
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.response.status).toBe(404);
      expect(await r.response.text()).toBe("Not Found");
    }
    await expect(requireAdminAction()).rejects.toThrow("NOT_FOUND");
  });
});
