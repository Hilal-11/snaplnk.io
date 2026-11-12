// app/admin/login/complete/route.ts
// Final step of every admin sign-in. Re-syncs the role from ADMIN_EMAILS, then either
// issues the signed 7-day admin-session cookie or records a denied attempt.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncUserAccess } from "@/lib/admin/sync";
import { evaluateAdminAccess } from "@/lib/admin/access";
import { ADMIN_COOKIE, getAdminEmails } from "@/lib/admin/config";
import { adminCookieOptions, getAdminSecret, signAdminSession } from "@/lib/admin/session";
import { writeAudit } from "@/lib/admin/audit";
import { rateLimit } from "@/lib/admin/ratelimit";
import { requestContext } from "@/lib/analytics/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const to = (path: string) => NextResponse.redirect(new URL(path, url.origin));
  const ctx = requestContext(request);

  if (!(await rateLimit("adminLogin", `complete:${ctx.ipHash ?? "unknown"}`))) {
    await writeAudit({ adminId: null, action: "admin.login_rate_limited", ip: ctx.ip });
    return to("/admin/login?error=rate");
  }

  const secret = getAdminSecret();
  if (!secret) return to("/admin/login?error=config");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return to("/admin/login?error=expired");

  const access = await syncUserAccess(user);
  const decision = evaluateAdminAccess({
    user,
    adminEmails: getAdminEmails(),
    storedRole: access.role,
    banned: access.banned,
    sessionValid: true,
  });

  if (decision !== "ok") {
    await writeAudit({
      adminId: null,
      action: "admin.login_denied",
      target: user.email ?? user.id,
      metadata: { userId: user.id, reason: access.banned ? "banned" : user.email_confirmed_at ? "not_admin" : "email_unverified" },
      ip: ctx.ip,
    });
    return to("/admin/login?error=denied");
  }

  const res = to("/admin");
  res.cookies.set(ADMIN_COOKIE, await signAdminSession(user.id, secret), adminCookieOptions);
  await writeAudit({ adminId: user.id, action: "admin.login", target: user.email ?? null, ip: ctx.ip });
  return res;
}
