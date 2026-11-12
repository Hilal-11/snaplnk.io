// lib/admin/session.ts
// Signed admin-session cookie: "<userId>.<issuedAtSec>.<hmac>". Proves the admin completed
// /admin/login within the last 7 days, independent of the (longer) Supabase session.
// Web Crypto only, so it works in proxy.ts and route handlers alike.
import { ADMIN_SESSION_MAX_AGE_SEC } from "./config";

const enc = new TextEncoder();

function b64url(buf: ArrayBuffer): string {
  let s = "";
  new Uint8Array(buf).forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Secret must be set and reasonably long; otherwise admin access is disabled (fail closed). */
export function getAdminSecret(): string | null {
  const s = process.env.ADMIN_SESSION_SECRET;
  return s && s.length >= 32 ? s : null;
}

export async function signAdminSession(userId: string, secret: string, nowSec = Math.floor(Date.now() / 1000)): Promise<string> {
  const payload = `${userId}.${nowSec}`;
  return `${payload}.${await hmac(secret, payload)}`;
}

export async function verifyAdminSession(
  value: string | undefined | null,
  userId: string,
  secret: string | null,
  nowSec = Math.floor(Date.now() / 1000)
): Promise<boolean> {
  if (!value || !secret) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const [uid, issued, sig] = parts;
  if (uid !== userId || !/^\d{1,12}$/.test(issued)) return false;
  const age = nowSec - Number(issued);
  if (age < -60 || age > ADMIN_SESSION_MAX_AGE_SEC) return false;
  return safeEqual(sig, await hmac(secret, `${uid}.${issued}`));
}

export const adminCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: ADMIN_SESSION_MAX_AGE_SEC,
};
