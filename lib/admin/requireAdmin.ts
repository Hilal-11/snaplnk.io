// lib/admin/requireAdmin.ts
// Server-side admin guard for server components, route handlers and server actions.
// Re-checks everything on every call (env list, verified email, stored role, ban flag,
// signed 7-day admin session) — never trusts the client or the proxy alone.
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_COOKIE, getAdminEmails } from "./config";
import { evaluateAdminAccess, type AdminDecision } from "./access";
import { getAdminSecret, verifyAdminSession } from "./session";
import { readUserAccess } from "./sync";

export type AdminCheck = { decision: AdminDecision; user: User | null };

export async function checkAdmin(): Promise<AdminCheck> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { decision: "unauthenticated", user: null };

  const [access, jar] = await Promise.all([readUserAccess(user.id), cookies()]);
  const sessionValid = await verifyAdminSession(jar.get(ADMIN_COOKIE)?.value, user.id, getAdminSecret());
  const decision = evaluateAdminAccess({
    user,
    adminEmails: getAdminEmails(),
    storedRole: access?.role,
    banned: access?.banned,
    sessionValid,
  });
  return { decision, user };
}

/** For admin pages/layouts: redirects non-admins; returns the admin user. */
export async function requireAdmin(): Promise<User> {
  const { decision, user } = await checkAdmin();
  if (decision === "ok" && user) return user;
  if (decision === "forbidden") redirect("/");
  redirect("/admin/login");
}

/** For /api/admin/* route handlers: non-admins get a bare 404 (route existence isn't revealed). */
export async function requireAdminApi(): Promise<{ ok: true; user: User } | { ok: false; response: Response }> {
  const { decision, user } = await checkAdmin();
  if (decision === "ok" && user) return { ok: true, user };
  return { ok: false, response: new Response("Not Found", { status: 404 }) };
}

/** For admin server actions: behaves like a missing route for non-admins. */
export async function requireAdminAction(): Promise<User> {
  const { decision, user } = await checkAdmin();
  if (decision === "ok" && user) return user;
  notFound();
}

/** CSRF guard for mutating admin route handlers (server actions have this built in). */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}
