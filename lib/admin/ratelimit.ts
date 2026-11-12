// lib/admin/ratelimit.ts
// Sliding-window limits for admin login, admin APIs and /api/track (Upstash Redis).
// If Redis is unavailable, a small per-instance in-memory window is used instead, so
// limits still apply (best effort on serverless) rather than silently disappearing.
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis";

const LIMITS = {
  adminLogin: { tokens: 5, windowMs: 15 * 60_000, window: "15 m" },
  adminApi: { tokens: 120, windowMs: 60_000, window: "1 m" },
  track: { tokens: 120, windowMs: 60_000, window: "1 m" },
} as const;
export type LimitKind = keyof typeof LIMITS;

const client = redis;
const upstash = client
  ? (Object.fromEntries(
      (Object.keys(LIMITS) as LimitKind[]).map((k) => [
        k,
        new Ratelimit({ redis: client, limiter: Ratelimit.slidingWindow(LIMITS[k].tokens, LIMITS[k].window), prefix: `rl:${k}` }),
      ])
    ) as Record<LimitKind, Ratelimit>)
  : null;

const memory = new Map<string, number[]>();
function memoryLimit(kind: LimitKind, key: string): boolean {
  const { tokens, windowMs } = LIMITS[kind];
  const now = Date.now();
  const k = `${kind}:${key}`;
  const hits = (memory.get(k) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= tokens) {
    memory.set(k, hits);
    return false;
  }
  hits.push(now);
  memory.set(k, hits);
  if (memory.size > 5000) memory.delete(memory.keys().next().value as string);
  return true;
}

/** true = allowed. */
export async function rateLimit(kind: LimitKind, key: string): Promise<boolean> {
  if (upstash) {
    try {
      return (await upstash[kind].limit(key)).success;
    } catch (err) {
      console.error("[ratelimit]", kind, err);
    }
  }
  return memoryLimit(kind, key);
}
