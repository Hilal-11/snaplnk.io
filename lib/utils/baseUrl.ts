// lib/utils/baseUrl.ts
// Canonical absolute origin of the app (no trailing slash). Server-side source of truth.

export function getBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.VERCEL_URL ??
    "localhost:3000";

  if (/^https?:\/\//.test(raw)) return raw.replace(/\/+$/, "");
  const proto = /^(localhost|127\.)/.test(raw) ? "http" : "https";
  return `${proto}://${raw}`.replace(/\/+$/, "");
}
