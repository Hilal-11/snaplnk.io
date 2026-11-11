// lib/bio/reserved.ts
// Names that can never be a bio-page username or a custom short-link alias,
// because they collide with app routes, infrastructure or brand/impersonation risk.
//
// KEEP IN SYNC with the seed block in supabase/migrations/*_bio_pages.sql
// (lib/bio/reserved.test.ts fails if the two lists drift).

export const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  // top-level app routes and route segments
  "api", "app", "auth", "bio", "go", "b", "u", "qr", "s", "l", "r",
  "dashboard", "signup", "signin", "login", "logout", "register", "callback",
  "pricing", "faq", "faqs", "docs", "blog", "blogs", "about", "terms", "privacy",
  "contact", "features", "changelog", "usage", "templates", "status", "health",
  // dashboard segments
  "links", "analytics", "qr_codes", "bio_pages", "archived", "expired", "deleted",
  "tags", "domains", "profile", "team", "api_keys", "billing", "settings", "new",
  "create", "edit", "admin", "reports",
  // infrastructure / well-known files
  "www", "mail", "email", "smtp", "ftp", "cdn", "static", "assets", "public",
  "robots", "sitemap", "favicon", "manifest", "well_known", "_next", "next",
  // brand + trust
  "snaplnk", "snaplink", "support", "help", "security", "abuse", "official",
  "staff", "team_snaplnk", "root", "system", "moderator", "verify", "verified",
  // placeholders
  "null", "undefined", "anonymous", "guest", "user", "username", "me", "test",
]);

/** Substrings that make a name look official (impersonation guard). */
export const RESERVED_SUBSTRINGS: readonly string[] = ["snaplnk", "snaplink"];

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;
const USERNAME_RE = /^[a-z0-9_]+$/;

/** Canonical form: trimmed, leading "@" removed, lowercased. */
export function normalizeUsername(input: string): string {
  return input.trim().replace(/^@+/, "").toLowerCase();
}

export type UsernameCheck =
  | { status: "ok"; username: string }
  | { status: "invalid" | "reserved"; username: string; message: string };

/** Validates an already-normalized-or-raw username. Normalizes first. */
export function checkUsername(input: string): UsernameCheck {
  const username = normalizeUsername(input);

  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
    return {
      status: "invalid",
      username,
      message: `Username must be ${USERNAME_MIN}-${USERNAME_MAX} characters`,
    };
  }
  if (!USERNAME_RE.test(username)) {
    return {
      status: "invalid",
      username,
      message: "Use only lowercase letters, numbers and underscores",
    };
  }
  if (username.startsWith("_") || username.endsWith("_")) {
    return { status: "invalid", username, message: "Username can't start or end with an underscore" };
  }
  if (username.includes("__")) {
    return { status: "invalid", username, message: "Username can't contain consecutive underscores" };
  }
  if (/^\d+$/.test(username)) {
    return { status: "invalid", username, message: "Username must contain at least one letter" };
  }
  if (RESERVED_USERNAMES.has(username) || RESERVED_SUBSTRINGS.some((s) => username.includes(s))) {
    return { status: "reserved", username, message: "That username is reserved" };
  }
  return { status: "ok", username };
}

/** Returns a user-facing error message, or null when the username is acceptable. */
export function validateUsername(input: string): string | null {
  const r = checkUsername(input);
  return r.status === "ok" ? null : r.message;
}

/**
 * Reserved check for custom short-link aliases (which also allow "-" and uppercase).
 * Treats "-" and "_" as equivalent so "qr-codes" and "qr_codes" are both blocked.
 */
export function isReservedAlias(alias: string): boolean {
  const a = alias.trim().toLowerCase();
  if (RESERVED_USERNAMES.has(a) || RESERVED_USERNAMES.has(a.replace(/-/g, "_"))) return true;
  return RESERVED_SUBSTRINGS.some((s) => a.includes(s));
}
