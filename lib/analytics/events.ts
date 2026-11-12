// lib/analytics/events.ts
// The single source of truth for tracked events (client and server).
// To add an event: add it to EVENT_NAMES (and its type to EVENT_TYPE if it isn't a plain
// "event"), then call track("your_event", { ... }) — see ADMIN.md.
import { z } from "zod";

export const EVENT_NAMES = [
  // navigation
  "page_view",
  // links & QR
  "link_create",
  "link_copy",
  "link_share",
  "qr_create",
  "qr_download",
  // bio pages
  "bio_template_select",
  "bio_page_create",
  "bio_page_publish",
  // discovery
  "search",
  "filter_used",
  "tag_click",
  "cta_click",
  // account
  "signup",
  "login",
  "logout",
  // misc
  "outbound_click",
  "theme_toggle",
  // quality
  "client_error",
  "web_vital",
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

/** Storage "type" column for each event name. */
export const EVENT_TYPE: Partial<Record<EventName, "pageview" | "error" | "vital">> = {
  page_view: "pageview",
  client_error: "error",
  web_vital: "vital",
};

export const MAX_BATCH = 25;
export const MAX_BODY_BYTES = 32 * 1024;

const shortStr = (max: number) => z.string().trim().max(max);

/** Flat, small metadata only: string/number/boolean/null values, max 20 keys. */
export const metadataSchema = z
  .record(shortStr(40), z.union([shortStr(500), z.number().finite(), z.boolean(), z.null()]))
  .refine((m) => Object.keys(m).length <= 20, { message: "Too many metadata keys" })
  .default({});

export const trackEventSchema = z.object({
  name: z.enum(EVENT_NAMES),
  path: shortStr(512).regex(/^\//, "path must start with /").optional(),
  referrer: shortStr(1024).optional(),
  ts: z.number().int().positive().optional(),
  metadata: metadataSchema,
});

export const trackBatchSchema = z.object({
  anonymousId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
  sessionId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
  events: z.array(trackEventSchema).min(1).max(MAX_BATCH),
});

export type TrackEvent = z.infer<typeof trackEventSchema>;
export type TrackBatch = z.infer<typeof trackBatchSchema>;

/** Pull utm_* params out of a path's query string. */
export function utmFrom(path: string | undefined): { utm_source: string | null; utm_medium: string | null; utm_campaign: string | null } {
  try {
    const q = new URL(path ?? "/", "http://x").searchParams;
    const v = (k: string) => q.get(k)?.slice(0, 120) || null;
    return { utm_source: v("utm_source"), utm_medium: v("utm_medium"), utm_campaign: v("utm_campaign") };
  } catch {
    return { utm_source: null, utm_medium: null, utm_campaign: null };
  }
}

export function domainOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}
