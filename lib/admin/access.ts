// lib/admin/access.ts
// The single admin decision, as a pure function (unit-tested). Every layer — proxy,
// /admin layout, admin route handlers, server actions — funnels through this.
import { isAdminEmail } from "./config";

export type AdminCandidate = {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
  is_anonymous?: boolean;
  app_metadata?: Record<string, unknown>;
};

export type AdminDecision =
  | "ok"
  | "unauthenticated" // no user → go to /admin/login
  | "forbidden" //       signed in but not an admin → 404 / home
  | "reauth"; //         admin, but no valid 7-day admin session → /admin/login

/** Role an account should have, from ADMIN_EMAILS + a provider-verified email. */
export function roleFor(user: AdminCandidate, adminEmails: readonly string[]): "ADMIN" | "USER" {
  return !user.is_anonymous && !!user.email_confirmed_at && isAdminEmail(user.email, adminEmails) ? "ADMIN" : "USER";
}

export function evaluateAdminAccess(input: {
  user: AdminCandidate | null;
  adminEmails: readonly string[];
  /** Role stored server-side (user_access / app_metadata). */
  storedRole: string | null | undefined;
  banned?: boolean;
  sessionValid: boolean;
}): AdminDecision {
  const { user } = input;
  if (!user) return "unauthenticated";
  // Must be an admin by env *right now* (removal from ADMIN_EMAILS takes effect immediately),
  // verified, not banned, and promoted server-side at sign-in.
  if (roleFor(user, input.adminEmails) !== "ADMIN") return "forbidden";
  if (input.storedRole !== "ADMIN" || input.banned) return "forbidden";
  if (!input.sessionValid) return "reauth";
  return "ok";
}
