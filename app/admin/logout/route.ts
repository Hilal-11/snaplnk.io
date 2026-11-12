// POST /admin/logout — ends the admin session (the normal Snaplnk session stays).
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin/config";
import { checkAdmin, isSameOrigin } from "@/lib/admin/requireAdmin";
import { writeAudit } from "@/lib/admin/audit";
import { requestContext } from "@/lib/analytics/server";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return new Response("Not Found", { status: 404 });
  const { decision, user } = await checkAdmin();
  const res = NextResponse.redirect(new URL("/admin/login", request.url), 303);
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  if (decision === "ok" && user) {
    await writeAudit({ adminId: user.id, action: "admin.logout", target: user.email ?? null, ip: requestContext(request).ip });
  }
  return res;
}
