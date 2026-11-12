// lib/analytics/server.ts
// Server-side event recording (signup/login, link creation...) and request context
// parsing shared with /api/track. Never throws — analytics must not break requests.
import { createHash } from "node:crypto";
import { geolocation } from "@vercel/functions";
import { UAParser } from "ua-parser-js";
import { isbot } from "isbot";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { hashIp } from "./hash";
import { EVENT_TYPE, type EventName } from "./events";

export type RequestContext = {
  ip: string | null;
  ipHash: string | null;
  userAgent: string;
  isBot: boolean;
  /** Visitor asked not to be tracked (DNT or Global Privacy Control). */
  optOut: boolean;
  country: string | null;
  city: string | null;
  device: "desktop" | "mobile" | "tablet";
  browser: string | null;
  os: string | null;
};

export function requestContext(request: Request): RequestContext {
  const h = request.headers;
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || null;
  const userAgent = (h.get("user-agent") ?? "").slice(0, 512);
  const ua = new UAParser(userAgent).getResult();
  const t = ua.device.type;
  let country: string | null = null;
  let city: string | null = null;
  try {
    const geo = geolocation(request);
    country = geo.country ?? h.get("x-vercel-ip-country") ?? null;
    city = geo.city ? decodeURIComponent(geo.city) : null;
  } catch {
    country = h.get("x-vercel-ip-country");
  }
  return {
    ip,
    ipHash: hashIp(ip),
    userAgent,
    isBot: !userAgent || isbot(userAgent),
    optOut: h.get("dnt") === "1" || h.get("sec-gpc") === "1",
    country: country?.slice(0, 8) ?? null,
    city: city?.slice(0, 120) ?? null,
    device: t === "mobile" || t === "tablet" ? t : "desktop",
    browser: ua.browser.name?.slice(0, 60) ?? null,
    os: ua.os.name?.slice(0, 60) ?? null,
  };
}

/** Records a trusted server-side event (e.g. login, link_create). Fire-and-forget safe. */
export async function trackServerEvent(
  request: Request | null,
  name: EventName,
  opts: { userId?: string | null; path?: string; metadata?: Record<string, string | number | boolean | null> } = {}
): Promise<void> {
  if (!hasServiceRole()) return;
  try {
    const ctx = request ? requestContext(request) : null;
    if (ctx?.isBot || ctx?.optOut) return;
    await createAdminClient()
      .from("analytics_events")
      .insert({
        type: EVENT_TYPE[name] ?? "event",
        name,
        user_id: opts.userId ?? null,
        path: opts.path ?? null,
        country: ctx?.country ?? null,
        city: ctx?.city ?? null,
        device: ctx?.device ?? null,
        browser: ctx?.browser ?? null,
        os: ctx?.os ?? null,
        ip_hash: ctx?.ipHash ?? null,
        metadata: { ...(opts.metadata ?? {}), source: "server" },
      });
  } catch (err) {
    console.error("[analytics] server event failed", name, err);
  }
}

/** Groups identical errors: first line of the message + first stack frame. */
export function errorFingerprint(message: string, stack?: string | null): string {
  const frame = (stack ?? "").split("\n").find((l) => /at |@/.test(l))?.trim() ?? "";
  const normalized = `${message.split("\n")[0]}|${frame}`.replace(/\d+/g, "#").slice(0, 600);
  return createHash("sha256").update(normalized).digest("hex").slice(0, 24);
}
