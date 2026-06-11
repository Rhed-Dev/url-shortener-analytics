import { describe, expect, it } from "vitest";
import { cacheTtlSeconds, checkExpiry } from "../src/lib/expiry";

const NOW = new Date("2026-06-12T12:00:00Z");
const hoursFromNow = (h: number) => new Date(NOW.getTime() + h * 3_600_000);

describe("checkExpiry", () => {
  it("treats links with no constraints as live", () => {
    expect(checkExpiry({ expiresAt: null, maxClicks: null }, 999_999, NOW)).toEqual({
      expired: false,
    });
  });

  it("keeps links live before their expiry date", () => {
    expect(
      checkExpiry({ expiresAt: hoursFromNow(1), maxClicks: null }, 0, NOW),
    ).toEqual({ expired: false });
  });

  it("expires links past their expiry date", () => {
    expect(
      checkExpiry({ expiresAt: hoursFromNow(-1), maxClicks: null }, 0, NOW),
    ).toEqual({ expired: true, reason: "expiresAt" });
  });

  it("expires exactly at the expiry instant (inclusive)", () => {
    expect(
      checkExpiry({ expiresAt: new Date(NOW), maxClicks: null }, 0, NOW),
    ).toEqual({ expired: true, reason: "expiresAt" });
  });

  it("keeps links live below their click limit", () => {
    expect(checkExpiry({ expiresAt: null, maxClicks: 100 }, 99, NOW)).toEqual({
      expired: false,
    });
  });

  it("expires links that reached their click limit", () => {
    expect(checkExpiry({ expiresAt: null, maxClicks: 100 }, 100, NOW)).toEqual({
      expired: true,
      reason: "maxClicks",
    });
    expect(checkExpiry({ expiresAt: null, maxClicks: 100 }, 150, NOW)).toEqual({
      expired: true,
      reason: "maxClicks",
    });
  });

  it("reports the time-based reason when both constraints have tripped", () => {
    expect(
      checkExpiry({ expiresAt: hoursFromNow(-1), maxClicks: 10 }, 50, NOW),
    ).toEqual({ expired: true, reason: "expiresAt" });
  });
});

describe("cacheTtlSeconds", () => {
  const DEFAULT = 3600;

  it("uses the default TTL when the link never expires", () => {
    expect(cacheTtlSeconds(null, DEFAULT, NOW)).toBe(DEFAULT);
  });

  it("caps at the default TTL for far-future expiry", () => {
    expect(cacheTtlSeconds(hoursFromNow(48), DEFAULT, NOW)).toBe(DEFAULT);
  });

  it("aligns the TTL with imminent expiry so the cache cannot outlive the link", () => {
    const in90s = new Date(NOW.getTime() + 90_000);
    expect(cacheTtlSeconds(in90s, DEFAULT, NOW)).toBe(90);
  });

  it("never returns less than 1 second (Redis rejects non-positive TTLs)", () => {
    expect(cacheTtlSeconds(hoursFromNow(-1), DEFAULT, NOW)).toBe(1);
    expect(cacheTtlSeconds(new Date(NOW), DEFAULT, NOW)).toBe(1);
  });

  it("rounds partial seconds up, never down to zero", () => {
    const in500ms = new Date(NOW.getTime() + 500);
    expect(cacheTtlSeconds(in500ms, DEFAULT, NOW)).toBe(1);
  });
});
