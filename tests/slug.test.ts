import { describe, expect, it } from "vitest";
import {
  GENERATED_SLUG_LENGTH,
  generateSlug,
  isPlausibleSlug,
  RESERVED_SLUGS,
  SLUG_PATTERN,
  validateCustomSlug,
} from "../src/lib/slug";

describe("validateCustomSlug", () => {
  it("accepts well-formed slugs", () => {
    for (const slug of ["abc", "my-launch", "My_Link_2026", "a1b2c3", "x".repeat(32)]) {
      expect(validateCustomSlug(slug)).toEqual({ ok: true });
    }
  });

  it("rejects slugs that are too short", () => {
    const result = validateCustomSlug("ab");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/at least 3/);
  });

  it("rejects slugs that are too long", () => {
    const result = validateCustomSlug("x".repeat(33));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/at most 32/);
  });

  it("rejects invalid characters", () => {
    for (const slug of ["has space", "émoji", "dot.dot", "slash/slash", "q?a", "a+b", "tag#1"]) {
      const result = validateCustomSlug(slug);
      expect(result.ok, `should reject "${slug}"`).toBe(false);
    }
  });

  it("rejects reserved words", () => {
    for (const slug of ["api", "admin", "login", "dashboard", "_next"]) {
      const result = validateCustomSlug(slug);
      expect(result.ok, `should reject "${slug}"`).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/reserved/);
    }
  });

  it("rejects reserved words case-insensitively", () => {
    for (const slug of ["API", "Admin", "LOGIN", "DashBoard"]) {
      expect(validateCustomSlug(slug).ok, `should reject "${slug}"`).toBe(false);
    }
  });

  it("keeps the reserved list lowercase so the lookup works", () => {
    for (const word of RESERVED_SLUGS) {
      expect(word).toBe(word.toLowerCase());
    }
  });
});

describe("generateSlug", () => {
  it("produces slugs of the configured length and charset", () => {
    for (let i = 0; i < 100; i++) {
      const slug = generateSlug();
      expect(slug).toHaveLength(GENERATED_SLUG_LENGTH);
      expect(slug).toMatch(SLUG_PATTERN);
    }
  });

  it("produces slugs that pass custom-slug validation", () => {
    for (let i = 0; i < 100; i++) {
      expect(validateCustomSlug(generateSlug())).toEqual({ ok: true });
    }
  });

  it("produces distinct slugs", () => {
    const seen = new Set(Array.from({ length: 100 }, () => generateSlug()));
    expect(seen.size).toBe(100);
  });
});

describe("isPlausibleSlug", () => {
  it("accepts anything slug-shaped, including short generated slugs", () => {
    expect(isPlausibleSlug("a")).toBe(true);
    expect(isPlausibleSlug("x9Kp2Qa")).toBe(true);
  });

  it("rejects empty, oversized, and malformed paths", () => {
    expect(isPlausibleSlug("")).toBe(false);
    expect(isPlausibleSlug("x".repeat(33))).toBe(false);
    expect(isPlausibleSlug("favicon.ico")).toBe(false);
    expect(isPlausibleSlug("a/b")).toBe(false);
  });
});
