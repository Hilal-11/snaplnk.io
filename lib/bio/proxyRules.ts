// lib/bio/proxyRules.ts
// Pure routing decisions used by proxy.ts (kept here so they can be unit-tested).

/** Public bio endpoints that accept writes from anyone (each is rate limited in its handler). */
const PUBLIC_BIO_API_WRITES = new Set(["/api/bio/view", "/api/bio/subscribe", "/api/bio/report"]);

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export type AccessRule = "public" | "real-user-page" | "real-user-api";

/**
 * - /dashboard/*                       -> signed-in, non-anonymous user (redirect otherwise)
 * - /api/bio/* writes (non-GET)        -> signed-in, non-anonymous user (401/403 JSON)
 *   except the public beacon/subscribe/report endpoints
 * - everything else (/@user, /bio/*, /go/*, short links, marketing) -> public
 */
export function getAccessRule(pathname: string, method: string): AccessRule {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return "real-user-page";

  if (pathname === "/api/bio" || pathname.startsWith("/api/bio/")) {
    if (SAFE_METHODS.has(method.toUpperCase())) return "public";
    const normalized = pathname.replace(/\/+$/, "");
    if (PUBLIC_BIO_API_WRITES.has(normalized)) return "public";
    return "real-user-api";
  }

  return "public";
}
