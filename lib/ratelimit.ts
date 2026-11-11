// lib/ratelimit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { waitUntil } from "@vercel/functions";
import { redis } from "@/lib/redis";

export type RateLimitResult = {
  allowed: boolean;
  /** true when Redis was unreachable / not configured */
  unavailable: boolean;
  limit: number;
  remaining: number;
  /** unix ms when the window resets */
  reset: number;
};

const limiters = redis
  ? {
      // Short burst guard (stops scripts hammering the endpoint)
      burst: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "10 s"),
        prefix: "rl:create:burst",
        analytics: true,
      }),
      // Guests: keyed by IP (new anonymous accounts are free, so user id is useless as a key)
      guestHourly: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 h"),
        prefix: "rl:create:guest",
        analytics: true,
      }),
      // Registered users: keyed by user id
      userHourly: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "1 h"),
        prefix: "rl:create:user",
        analytics: true,
      }),
    }
  : null;

/**
 * What to do when Redis is missing or down.
 *  - Guests  -> fail CLOSED (they're the abuse vector; better to reject than be flooded)
 *  - Users   -> fail OPEN   (don't punish paying/real users for an infra problem)
 *  - Dev     -> always allow so you can work without Redis
 */
function fallback(isGuest: boolean): RateLimitResult {
  const isProd = process.env.NODE_ENV === "production";
  const allowed = !isProd || !isGuest;
  return { allowed, unavailable: true, limit: 0, remaining: 0, reset: Date.now() + 60_000 };
}

async function run(limiter: Ratelimit, key: string): Promise<RateLimitResult> {
  const r = await limiter.limit(key);
  // Lets Upstash analytics finish after the response is sent (serverless-safe)
  waitUntil(r.pending);
  return {
    allowed: r.success,
    unavailable: false,
    limit: r.limit,
    remaining: r.remaining,
    reset: r.reset,
  };
}

export async function limitLinkCreation(opts: {
  isGuest: boolean;
  ip: string;
  userId: string;
}): Promise<RateLimitResult> {
  if (!limiters) return fallback(opts.isGuest);

  const key = opts.isGuest ? `ip:${opts.ip}` : `user:${opts.userId}`;

  try {
    const burst = await run(limiters.burst, key);
    if (!burst.allowed) return burst;

    return await run(opts.isGuest ? limiters.guestHourly : limiters.userHourly, key);
  } catch (err) {
    console.error("[ratelimit] Redis error:", err);
    return fallback(opts.isGuest);
  }
}

export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
  if (r.unavailable) return {};
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(r.limit),
    "X-RateLimit-Remaining": String(Math.max(0, r.remaining)),
    "X-RateLimit-Reset": String(Math.ceil(r.reset / 1000)),
  };
  if (!r.allowed) {
    headers["Retry-After"] = String(Math.max(1, Math.ceil((r.reset - Date.now()) / 1000)));
  }
  return headers;
}