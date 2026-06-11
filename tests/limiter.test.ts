import { describe, expect, it } from "vitest";
import {
  SlidingWindowLimiter,
  type SortedSetStore,
} from "../src/lib/rate-limit/limiter";

/**
 * In-memory sorted set implementing exactly the Redis operations the
 * limiter uses — same inclusive-range semantics as the real commands.
 */
class FakeSortedSetStore implements SortedSetStore {
  private sets = new Map<string, Map<string, number>>();
  public ttls = new Map<string, number>();

  private set(key: string): Map<string, number> {
    let s = this.sets.get(key);
    if (!s) {
      s = new Map();
      this.sets.set(key, s);
    }
    return s;
  }

  async zremrangebyscore(key: string, min: number, max: number): Promise<number> {
    const s = this.set(key);
    let removed = 0;
    for (const [member, score] of s) {
      if (score >= min && score <= max) {
        s.delete(member);
        removed++;
      }
    }
    return removed;
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    this.set(key).set(member, score);
    return 1;
  }

  async zcard(key: string): Promise<number> {
    return this.set(key).size;
  }

  async zrange(
    key: string,
    start: number,
    stop: number,
    _withScores: "WITHSCORES",
  ): Promise<string[]> {
    const sorted = [...this.set(key).entries()].sort((a, b) => a[1] - b[1]);
    const slice = sorted.slice(start, stop + 1);
    return slice.flatMap(([member, score]) => [member, String(score)]);
  }

  async zrem(key: string, ...members: string[]): Promise<number> {
    const s = this.set(key);
    let removed = 0;
    for (const member of members) {
      if (s.delete(member)) removed++;
    }
    return removed;
  }

  async pexpire(key: string, milliseconds: number): Promise<number> {
    this.ttls.set(key, milliseconds);
    return 1;
  }
}

const WINDOW = 60_000;
const T0 = 1_750_000_000_000;

function makeLimiter(limit: number) {
  const store = new FakeSortedSetStore();
  const limiter = new SlidingWindowLimiter(store, {
    limit,
    windowMs: WINDOW,
    prefix: "rl:test",
  });
  return { store, limiter };
}

describe("SlidingWindowLimiter", () => {
  it("allows requests under the limit and counts remaining down", async () => {
    const { limiter } = makeLimiter(5);
    for (let i = 0; i < 5; i++) {
      const result = await limiter.check("1.2.3.4", T0 + i * 1000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5 - i - 1);
      expect(result.retryAfterMs).toBe(0);
    }
  });

  it("blocks the request that exceeds the limit", async () => {
    const { limiter } = makeLimiter(3);
    for (let i = 0; i < 3; i++) {
      await limiter.check("1.2.3.4", T0 + i * 1000);
    }
    const blocked = await limiter.check("1.2.3.4", T0 + 4000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
    expect(blocked.retryAfterMs).toBeLessThanOrEqual(WINDOW);
  });

  it("computes retryAfterMs from the oldest request in the window", async () => {
    const { limiter } = makeLimiter(2);
    await limiter.check("ip", T0); // oldest
    await limiter.check("ip", T0 + 5_000);
    const blocked = await limiter.check("ip", T0 + 10_000);
    expect(blocked.allowed).toBe(false);
    // Slot frees when the T0 marker ages out: T0 + 60s - (T0 + 10s) = 50s.
    expect(blocked.retryAfterMs).toBe(50_000);
  });

  it("slides: old requests age out and free capacity exactly one window later", async () => {
    const { limiter } = makeLimiter(3);
    await limiter.check("ip", T0);
    await limiter.check("ip", T0 + 1_000);
    await limiter.check("ip", T0 + 2_000);

    // Still inside the window of the first request -> blocked.
    const blocked = await limiter.check("ip", T0 + 30_000);
    expect(blocked.allowed).toBe(false);

    // First marker (T0) has aged out at T0 + window + 1ms -> allowed again.
    const allowed = await limiter.check("ip", T0 + WINDOW + 1);
    expect(allowed.allowed).toBe(true);
  });

  it("does NOT allow boundary bursts like a fixed window would", async () => {
    // Fixed-window classic failure: limit N, N requests at the end of one
    // bucket plus N at the start of the next = 2N in seconds. The sliding
    // window must reject the second burst.
    const { limiter } = makeLimiter(5);
    for (let i = 0; i < 5; i++) {
      const r = await limiter.check("ip", T0 + 59_000 + i * 100);
      expect(r.allowed).toBe(true);
    }
    for (let i = 0; i < 5; i++) {
      const r = await limiter.check("ip", T0 + 60_500 + i * 100);
      expect(r.allowed).toBe(false);
    }
  });

  it("a blocked request does not consume quota (rollback)", async () => {
    const { limiter } = makeLimiter(1);
    await limiter.check("ip", T0);
    // Several blocked attempts...
    await limiter.check("ip", T0 + 1_000);
    await limiter.check("ip", T0 + 2_000);
    // ...must not push the retry horizon: after the original marker ages
    // out, the client is allowed again.
    const allowed = await limiter.check("ip", T0 + WINDOW + 1);
    expect(allowed.allowed).toBe(true);
  });

  it("isolates identifiers", async () => {
    const { limiter } = makeLimiter(1);
    const a = await limiter.check("ip-a", T0);
    const blockedA = await limiter.check("ip-a", T0 + 10);
    const b = await limiter.check("ip-b", T0 + 20);
    expect(a.allowed).toBe(true);
    expect(blockedA.allowed).toBe(false);
    expect(b.allowed).toBe(true);
  });

  it("sets a TTL on the key so idle clients don't leak memory", async () => {
    const { store, limiter } = makeLimiter(2);
    await limiter.check("ip", T0);
    expect(store.ttls.get("rl:test:ip")).toBe(WINDOW);
  });

  it("rejects nonsensical configuration", () => {
    const { store } = makeLimiter(1);
    expect(
      () => new SlidingWindowLimiter(store, { limit: 0, windowMs: 1000 }),
    ).toThrow();
    expect(
      () => new SlidingWindowLimiter(store, { limit: 5, windowMs: 0 }),
    ).toThrow();
  });
});
