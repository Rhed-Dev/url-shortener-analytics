/**
 * Lazy link expiration.
 *
 * Links can expire by wall-clock time (`expiresAt`) or by usage
 * (`maxClicks`). There is no cron sweep: expiry is evaluated on read, and
 * the Redis cache TTL is capped at the link's remaining lifetime so a cached
 * entry can never outlive its link. See the README for the full rationale.
 */

export interface ExpirableLink {
  expiresAt: Date | null;
  maxClicks: number | null;
}

export type ExpiryReason = "expiresAt" | "maxClicks";

export type ExpiryStatus =
  | { expired: false }
  | { expired: true; reason: ExpiryReason };

export function checkExpiry(
  link: ExpirableLink,
  clickCount: number,
  now: Date = new Date(),
): ExpiryStatus {
  if (link.expiresAt !== null && now.getTime() >= link.expiresAt.getTime()) {
    return { expired: true, reason: "expiresAt" };
  }
  if (link.maxClicks !== null && clickCount >= link.maxClicks) {
    return { expired: true, reason: "maxClicks" };
  }
  return { expired: false };
}

/**
 * TTL (in seconds) for a cached link: the default cache TTL, capped by the
 * time remaining until `expiresAt`. Returns at least 1 second because Redis
 * rejects non-positive TTLs.
 */
export function cacheTtlSeconds(
  expiresAt: Date | null,
  defaultTtlSeconds: number,
  now: Date = new Date(),
): number {
  if (expiresAt === null) return defaultTtlSeconds;
  const untilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / 1000);
  return Math.max(1, Math.min(defaultTtlSeconds, untilExpiry));
}
