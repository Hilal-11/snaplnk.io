// lib/validators/url.ts

export type UrlValidation =
  | { ok: true; url: string }
  | { ok: false; error: string };

const MAX_URL_LENGTH = 2048;

function isPrivateOrInternalHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h.endsWith(".internal")
  ) {
    return true;
  }

  // IPv6
  if (h.includes(":")) {
    return (
      h === "::" ||
      h === "::1" ||
      h.startsWith("fc") ||
      h.startsWith("fd") ||
      h.startsWith("fe80") ||
      h.startsWith("::ffff:")
    );
  }

  // IPv4 (WHATWG URL already normalises 2130706433 / 0x7f.1 -> 127.0.0.1)
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127)
    );
  }

  // Single-label hosts like http://intranet are never public websites
  if (!h.includes(".")) return true;

  return false;
}

export function validateDestinationUrl(
  input: string,
  opts: { blockedHosts?: string[] } = {}
): UrlValidation {
  const raw = input.trim();

  if (!raw) return { ok: false, error: "original_url is required" };
  if (raw.length > MAX_URL_LENGTH) {
    return { ok: false, error: `URL is too long (max ${MAX_URL_LENGTH} characters)` };
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, error: "original_url is not a valid URL" };
  }

  // Blocks javascript:, data:, file:, ftp:, etc.
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Only http and https URLs are allowed" };
  }

  // https://google.com@evil.com style phishing
  if (parsed.username || parsed.password) {
    return { ok: false, error: "URLs with embedded credentials are not allowed" };
  }

  const host = parsed.hostname.toLowerCase();

  // Prevent redirect loops / shortening our own links
  for (const blocked of opts.blockedHosts ?? []) {
    const b = blocked.toLowerCase();
    if (host === b || host.endsWith(`.${b}`)) {
      return { ok: false, error: "You can't shorten a Snaplnk link" };
    }
  }

  if (isPrivateOrInternalHost(host)) {
    return { ok: false, error: "That URL points to a private or internal address" };
  }

  return { ok: true, url: parsed.href };
}