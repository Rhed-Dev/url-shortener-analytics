/**
 * Sliding-window rate limiter on a Redis sorted set, implemented from
 * scratch (no rate-limit library).
 *
 * Each client gets one sorted set. Members are unique request markers,
 * scores are millisecond timestamps. On every check:
 *
 *   1. ZREMRANGEBYSCORE drops markers older than the window.
 *   2. ZADD optimistically inserts a marker for this request.
 *   3. ZCARD counts requests inside the window (including this one).
 *   4. If the count exceeds the limit, the marker is removed again (the
 *      rejected request must not consume quota) and the retry delay is
 *      derived from the OLDEST surviving marker: the window frees one slot
 *      exactly when that marker ages out.
 *
 * Unlike a fixed window, this cannot be gamed at bucket boundaries: a burst
 * at 11:59:59 still counts against requests at 12:00:01.
 *
 * The store is injected behind a minimal interface so unit tests can run
 * against an in-memory sorted set, and production can pass an ioredis
 * client adapter.
 */

export interface SortedSetStore {
  zremrangebyscore(key: string, min: number, max: number): Promise<number>;
  zadd(key: string, score: number, member: string): Promise<unknown>;
  zcard(key: string): Promise<number>;
  zrange(
    key: string,
    start: number,
    stop: number,
    withScores: "WITHSCORES",
  ): Promise<string[]>;
  zrem(key: string, ...members: string[]): Promise<number>;
  pexpire(key: string, milliseconds: number): Promise<number>;
}

export interface SlidingWindowOptions {
  /** Maximum number of requests allowed inside one window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
  /** Key namespace, e.g. "rl:create". */
  prefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  /** Requests left in the current window (0 when blocked). */
  remaining: number;
  /** How long to wait before the next request can succeed (0 when allowed). */
  retryAfterMs: number;
}

export class SlidingWindowLimiter {
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly prefix: string;

  constructor(
    private readonly store: SortedSetStore,
    options: SlidingWindowOptions,
  ) {
    if (options.limit < 1) throw new Error("limit must be >= 1");
    if (options.windowMs < 1) throw new Error("windowMs must be >= 1");
    this.limit = options.limit;
    this.windowMs = options.windowMs;
    this.prefix = options.prefix ?? "rl";
  }

  /**
   * Check (and consume) one request slot for `identifier`.
   * `now` is injectable for deterministic tests.
   */
  async check(identifier: string, now: number = Date.now()): Promise<RateLimitResult> {
    const key = `${this.prefix}:${identifier}`;
    const windowStart = now - this.windowMs;

    // 1. Evict markers that have aged out of the window.
    await this.store.zremrangebyscore(key, 0, windowStart);

    // 2. Optimistic insert — doing ZADD before ZCARD means two racing
    //    requests can never both observe "one slot left" and both pass.
    const member = `${now}:${Math.random().toString(36).slice(2, 10)}`;
    await this.store.zadd(key, now, member);

    // Keep the key from leaking memory if this client never returns.
    await this.store.pexpire(key, this.windowMs);

    const count = await this.store.zcard(key);

    if (count > this.limit) {
      // 3. Over the limit: roll back our marker so a blocked request
      //    does not extend the caller's penalty.
      await this.store.zrem(key, member);

      const oldest = await this.store.zrange(key, 0, 0, "WITHSCORES");
      const oldestScore = oldest.length >= 2 ? Number(oldest[1]) : now;
      const retryAfterMs = Math.max(1, oldestScore + this.windowMs - now);

      return { allowed: false, limit: this.limit, remaining: 0, retryAfterMs };
    }

    return {
      allowed: true,
      limit: this.limit,
      remaining: this.limit - count,
      retryAfterMs: 0,
    };
  }
}
