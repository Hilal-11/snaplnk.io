// lib/admin/proxyRules.ts — which admin rule a path falls under (pure, unit-tested).
export type AdminRouteRule = "admin-page" | "admin-api" | "admin-login" | null;

export function adminRouteRule(pathname: string): AdminRouteRule {
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) return "admin-login";
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin-page";
  if (pathname === "/api/admin" || pathname.startsWith("/api/admin/")) return "admin-api";
  return null;
}
