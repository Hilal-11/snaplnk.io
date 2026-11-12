// lib/admin/params.ts
// Zod schemas for every admin list's URL params. Invalid values fall back to defaults
// (.catch) instead of erroring, so a hand-edited URL can never break a page.
import { z } from "zod";
import { EVENT_NAMES } from "@/lib/analytics/events";

export type SearchParams = { [key: string]: string | string[] | undefined };

const str = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .catch(undefined)
    .transform((v) => (v ? v : undefined));
const page = z.coerce.number().int().min(1).max(100_000).catch(1);
const dir = z.enum(["asc", "desc"]).catch("desc");
const uuid = z.uuid().optional().catch(undefined);

export const RANGES = ["today", "7d", "30d", "90d"] as const;
export type RangeKey = (typeof RANGES)[number];

export const rangeParams = z.object({ range: z.enum(RANGES).catch("30d") });

export const usersParams = z.object({
  q: str(100),
  role: z.enum(["ADMIN", "USER"]).optional().catch(undefined),
  status: z.enum(["active", "banned", "unverified", "guest"]).optional().catch(undefined),
  sort: z.enum(["created", "last_seen", "email", "links", "clicks", "events"]).catch("created"),
  dir,
  page,
});

export const linksParams = z.object({
  q: str(200),
  status: z.enum(["active", "disabled", "archived", "expired", "deleted"]).optional().catch(undefined),
  owner: uuid,
  sort: z.enum(["created", "clicks", "last_click", "code"]).catch("created"),
  dir,
  page,
});

export const bioParams = z.object({
  q: str(100),
  status: z.enum(["published", "draft", "suspended"]).optional().catch(undefined),
  page,
});

export const eventsParams = z.object({
  name: z.enum(EVENT_NAMES).optional().catch(undefined),
  type: z.enum(["pageview", "event", "error", "vital"]).optional().catch(undefined),
  path: str(200),
  user: uuid,
  session: str(64),
  page,
});

export const errorsParams = z.object({
  view: z.enum(["open", "resolved"]).catch("open"),
  page,
});

export const auditParams = z.object({ action: str(64), page });
export const pageOnlyParams = z.object({ page });

/** Flattens Next's searchParams (first value wins) and parses with a schema. */
export function parseParams<S extends z.ZodType>(schema: S, sp: SearchParams): z.output<S> {
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    const value = Array.isArray(v) ? v[0] : v;
    if (typeof value === "string") flat[k] = value;
  }
  return schema.parse(flat);
}

/** UTC window for a range key. `to` is rounded up to the minute so caches can be shared. */
export function rangeWindow(range: RangeKey, now: Date = new Date()): { from: string; to: string; days: number } {
  const to = new Date(Math.ceil(now.getTime() / 60_000) * 60_000);
  const days = range === "today" ? 1 : Number.parseInt(range, 10);
  const from =
    range === "today"
      ? new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()))
      : new Date(to.getTime() - days * 86_400_000);
  return { from: from.toISOString(), to: to.toISOString(), days };
}

export const PAGE_SIZE = 25;
