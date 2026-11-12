// lib/safeNext.ts
// Validates a post-auth redirect target. Only same-site absolute paths are allowed,
// so "?next=" can never be used as an open redirect (//evil.com, https://…, /\evil).
export function safeNext(raw: unknown, fallback = "/dashboard"): string {
  if (typeof raw !== "string") return fallback;
  const v = raw.trim();
  if (!v || v.length > 1000) return fallback;
  if (!v.startsWith("/") || v.startsWith("//") || v.includes("\\")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(v)) return fallback;
  return v;
}

/** Where to send a signed-out visitor who tried to shorten `url` on the landing page. */
export function signupForUrl(url: string): string {
  const next = `/dashboard/links/new?url=${encodeURIComponent(url.trim().slice(0, 2048))}`;
  return `/signup?next=${encodeURIComponent(next)}`;
}
