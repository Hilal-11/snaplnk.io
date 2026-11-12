// lib/admin/config.ts
// Admin identity comes ONLY from the ADMIN_EMAILS env (comma-separated). Server-side only:
// never import this from a client component (env vars without NEXT_PUBLIC_ aren't bundled anyway).

export function parseAdminEmails(raw: string | undefined | null): string[] {
  return Array.from(
    new Set(
      (raw ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    )
  );
}

export function getAdminEmails(): string[] {
  return parseAdminEmails(process.env.ADMIN_EMAILS);
}

export function isAdminEmail(email: string | null | undefined, list: readonly string[] = getAdminEmails()): boolean {
  return !!email && list.includes(email.trim().toLowerCase());
}

export const ADMIN_SESSION_MAX_AGE_SEC = 7 * 24 * 60 * 60; // admin sessions expire after 7 days
export const ADMIN_COOKIE = "snl_admin";
