import { envInt } from "./env";
import { cacheTtlSeconds } from "./expiry";
import { getRedis } from "./redis";

/**
 * Cache-aside store for the redirect hot path: slug -> link metadata.
 *
 * - Read: try Redis; on miss the route falls back to Postgres and warms
 *   the cache.
 * - TTL: default LINK_CACHE_TTL_SECONDS, but never past the link's
 *   `expiresAt` (an expired link must not be served from cache).
 * - Writes that mutate a link (edit/disable/delete) call `invalidateLink`.
 * - Every operation degrades to a no-op if Redis is down or unconfigured;
 *   correctness comes from Postgres, Redis only buys latency.
 */
export interface CachedLink {
  id: string;
  destination: string;
  disabled: boolean;
  /** ISO timestamp — JSON-safe. */
  expiresAt: string | null;
  maxClicks: number | null;
}

const keyFor = (slug: string): string => `link:${slug}`;

export async function getCachedLink(slug: string): Promise<CachedLink | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get(keyFor(slug));
    return raw ? (JSON.parse(raw) as CachedLink) : null;
  } catch (err) {
    console.warn(`[cache] read failed: ${(err as Error).message}`);
    return null;
  }
}

export async function cacheLink(slug: string, link: CachedLink): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const ttl = cacheTtlSeconds(
    link.expiresAt ? new Date(link.expiresAt) : null,
    envInt("LINK_CACHE_TTL_SECONDS", 3600),
  );
  try {
    await redis.set(keyFor(slug), JSON.stringify(link), "EX", ttl);
  } catch (err) {
    console.warn(`[cache] write failed: ${(err as Error).message}`);
  }
}

export async function invalidateLink(slug: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(keyFor(slug));
  } catch (err) {
    console.warn(`[cache] invalidate failed: ${(err as Error).message}`);
  }
}
