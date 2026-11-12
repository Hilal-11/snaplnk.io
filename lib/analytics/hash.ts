// lib/analytics/hash.ts
// Privacy: raw IPs are never stored. IPs become a salted SHA-256 whose salt rotates
// daily (ANALYTICS_SALT + UTC date), so hashes can't be joined across days or reversed
// by brute-forcing the IPv4 space without the secret.
import { createHash, createHmac } from "node:crypto";

function secret(): string {
  return process.env.ANALYTICS_SALT ?? "";
}

export function dailySalt(now: Date = new Date(), base: string = secret()): string {
  return createHash("sha256").update(`${base}:${now.toISOString().slice(0, 10)}`).digest("hex");
}

/** Daily-rotating IP hash (analytics, audit log). null when there is no IP. */
export function hashIp(ip: string | null | undefined, now: Date = new Date(), base: string = secret()): string | null {
  if (!ip || ip === "unknown") return null;
  return createHash("sha256").update(`${dailySalt(now, base)}:${ip}`).digest("hex").slice(0, 32);
}

/**
 * Stable visitor fingerprint for link-click unique counting (not rotated, so a returning
 * visitor counts once). Keyed with ANALYTICS_SALT so it can't be reversed to an IP.
 */
export function visitorHash(ip: string | null | undefined, userAgent: string, base: string = secret()): string {
  const data = `${ip || "unknown"}-${userAgent}`;
  return base
    ? createHmac("sha256", base).update(data).digest("hex")
    : createHash("sha256").update(data).digest("hex"); // legacy behaviour until the secret is set
}
