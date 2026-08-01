/**
 * Rate limiter with automatic backend selection:
 *
 *  - If UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are set, uses
 *    Upstash Redis (@upstash/ratelimit) — a shared, atomic sliding-window
 *    counter that works correctly across any number of serverless
 *    instances (Vercel, Lambda, etc).
 *  - Otherwise falls back to the original in-memory implementation, which
 *    is fine for a single-instance deployment (VPS, Railway, Render,
 *    Fly.io single machine) or local dev, but is NOT correctly shared
 *    across multiple instances.
 *
 * Call sites don't need to know which backend is active — `checkRateLimit`
 * is async either way, so it's a drop-in for both.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

// One Redis client, reused across invocations/requests.
const redis = hasUpstash
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Upstash Ratelimit instances are keyed by (limit, windowMs) pair since the
// library bakes the window into the limiter object. Cache them so we don't
// construct a new one per request.
const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit {
  const cacheKey = `${limit}:${windowMs}`;
  let limiter = upstashLimiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      analytics: false,
      prefix: "aniverse-rl",
    });
    upstashLimiters.set(cacheKey, limiter);
  }
  return limiter;
}

// ---- In-memory fallback (unchanged behavior from the original version) ----

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

function checkRateLimitInMemory(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  cleanup();
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { ok: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

/**
 * @param key unique identifier — usually `${route}:${ip}` or `${route}:${userId}`
 * @param limit max requests allowed per window
 * @param windowMs window size in milliseconds
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (hasUpstash) {
    try {
      const limiter = getUpstashLimiter(limit, windowMs);
      const result = await limiter.limit(key);
      return {
        ok: result.success,
        remaining: result.remaining,
        resetAt: result.reset,
      };
    } catch (err) {
      // Redis is unreachable — fail open to the in-memory limiter rather
      // than taking the whole app down because a rate limit check errored.
      console.error("[rate-limit] Upstash error, falling back to in-memory:", err);
      return checkRateLimitInMemory(key, limit, windowMs);
    }
  }

  return checkRateLimitInMemory(key, limit, windowMs);
}

/** Best-effort client IP extraction behind proxies (Vercel, nginx, etc). */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
