// lib/bio/ratelimit.ts
// Sliding-window limits for Bio Pages endpoints (Upstash). Bio endpoints are
// only used by signed-in, non-guest users, so they fail OPEN if Redis is down.
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis";
import { rateLimitHeaders, type RateLimitResult } from "@/lib/ratelimit";

const LIMITS = {
  create: { tokens: 5, window: "10 m" },
  write: { tokens: 120, window: "1 m" }, // autosave
  publish: { tokens: 20, window: "1 m" },
  check: { tokens: 60, window: "1 m" }, // username availability
} as const;

export type BioLimitKind = keyof typeof LIMITS;

const client = redis;
const limiters = client
  ? Object.fromEntries(
      Object.entries(LIMITS).map(([kind, l]) => [
        kind,
        new Ratelimit({
          redis: client,
          limiter: Ratelimit.slidingWindow(l.tokens, l.window),
          prefix: `rl:bio:${kind}`,
        }),
      ])
    )
  : null;

export async function limitBio(kind: BioLimitKind, userId: string): Promise<RateLimitResult> {
  const limiter = limiters?.[kind];
  if (!limiter) return { allowed: true, unavailable: true, limit: 0, remaining: 0, reset: Date.now() };
  try {
    const r = await limiter.limit(`user:${userId}`);
    return { allowed: r.success, unavailable: false, limit: r.limit, remaining: r.remaining, reset: r.reset };
  } catch (err) {
    console.error("[bio ratelimit]", err);
    return { allowed: true, unavailable: true, limit: 0, remaining: 0, reset: Date.now() };
  }
}

export function tooManyRequests(r: RateLimitResult): Response {
  return Response.json({ error: "Too many requests. Please slow down." }, { status: 429, headers: rateLimitHeaders(r) });
}
