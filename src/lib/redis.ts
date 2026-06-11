import Redis from "ioredis";

/**
 * Lazy Redis singleton.
 *
 * - Created on first use, never at import time (keeps builds offline-safe).
 * - Returns `null` when REDIS_URL is unset so callers can degrade gracefully:
 *   the redirect cache becomes a no-op and the rate limiter fails open.
 */
const globalForRedis = globalThis as unknown as { redis?: Redis | null };

export function getRedis(): Redis | null {
  if (globalForRedis.redis !== undefined) return globalForRedis.redis;

  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn(
      "[redis] REDIS_URL is not set — redirect caching and rate limiting are disabled.",
    );
    globalForRedis.redis = null;
    return null;
  }

  const client = new Redis(url, {
    lazyConnect: true,
    connectTimeout: 2000,
    maxRetriesPerRequest: 1,
  });
  // Without a listener, a downed Redis would emit unhandled error events.
  client.on("error", (err: Error) => {
    console.warn(`[redis] ${err.message}`);
  });

  globalForRedis.redis = client;
  return client;
}
