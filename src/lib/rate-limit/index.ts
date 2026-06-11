import type Redis from "ioredis";
import type { NextRequest } from "next/server";
import { envInt } from "../env";
import { getRedis } from "../redis";
import {
  SlidingWindowLimiter,
  type RateLimitResult,
  type SortedSetStore,
} from "./limiter";

export type { RateLimitResult, SortedSetStore } from "./limiter";
export { SlidingWindowLimiter } from "./limiter";

/** Adapts an ioredis client to the minimal store the limiter needs. */
export function asSortedSetStore(redis: Redis): SortedSetStore {
  return {
    zremrangebyscore: (key, min, max) => redis.zremrangebyscore(key, min, max),
    zadd: (key, score, member) => redis.zadd(key, score, member),
    zcard: (key) => redis.zcard(key),
    zrange: (key, start, stop, withScores) =>
      redis.zrange(key, start, stop, withScores),
    zrem: (key, ...members) => redis.zrem(key, ...members),
    pexpire: (key, ms) => redis.pexpire(key, ms),
  };
}

export type LimiterKind = "create" | "redirect";

/** Best-effort client IP. Trusts the first hop of x-forwarded-for. */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip") ?? "127.0.0.1";
}

/**
 * Apply the per-IP sliding-window limit for the given action.
 *
 * Returns `null` when the request is allowed. Fails OPEN (also `null`) when
 * Redis is unreachable: at this project's scale, serving a few unmetered
 * requests during a Redis outage beats taking every link offline.
 */
export async function enforceRateLimit(
  req: NextRequest,
  kind: LimiterKind,
): Promise<RateLimitResult | null> {
  const redis = getRedis();
  if (!redis) return null;

  const config =
    kind === "create"
      ? { limit: envInt("RATE_LIMIT_CREATE_PER_MIN", 10), prefix: "rl:create" }
      : {
          limit: envInt("RATE_LIMIT_REDIRECT_PER_MIN", 120),
          prefix: "rl:redirect",
        };

  const limiter = new SlidingWindowLimiter(asSortedSetStore(redis), {
    limit: config.limit,
    windowMs: 60_000,
    prefix: config.prefix,
  });

  try {
    const result = await limiter.check(getClientIp(req));
    return result.allowed ? null : result;
  } catch (err) {
    console.warn(
      `[rate-limit] Redis unavailable, failing open: ${(err as Error).message}`,
    );
    return null;
  }
}
