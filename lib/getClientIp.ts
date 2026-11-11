// lib/utils/getClientIp.ts
import { ipAddress } from "@vercel/functions";

/**
 * On Vercel the platform sets the real client IP, so it can't be spoofed.
 * Off Vercel, x-forwarded-for is client-controllable unless your proxy overwrites it.
 */
export function getClientIp(request: Request): string {
  const fromVercel = ipAddress(request);
  if (fromVercel) return fromVercel;

  const xff = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (xff) return xff;

  return request.headers.get("x-real-ip") ?? "unknown";
}