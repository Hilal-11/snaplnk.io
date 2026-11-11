// lib/redis.ts
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  // Don't throw at import time: `next build` imports route modules and would fail.
  console.warn(
    "[redis] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set. " +
      "Rate limiting and caching are disabled."
  );
}

// Upstash Redis talks over HTTP, so it works on Vercel serverless/edge
// with no connection pooling problems.
export const redis: Redis | null = url && token ? new Redis({ url, token }) : null;