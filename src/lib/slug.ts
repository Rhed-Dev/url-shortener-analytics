import { customAlphabet } from "nanoid";

export const SLUG_PATTERN = /^[a-zA-Z0-9_-]+$/;
export const MIN_SLUG_LENGTH = 3;
export const MAX_SLUG_LENGTH = 32;
export const GENERATED_SLUG_LENGTH = 7;

/**
 * Slugs that would shadow application routes or invite confusion.
 * Checked case-insensitively.
 */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "api",
  "admin",
  "login",
  "register",
  "logout",
  "dashboard",
  "links",
  "link",
  "stats",
  "analytics",
  "settings",
  "account",
  "auth",
  "docs",
  "about",
  "terms",
  "privacy",
  "support",
  "pricing",
  "assets",
  "static",
  "public",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "_next",
  "next",
  "gone",
  "404",
  "410",
  "qr",
  "health",
  "status",
  "www",
  "app",
  "root",
  "new",
  "index",
]);

// URL-safe, unambiguous, 62^7 ≈ 3.5 trillion combinations at length 7.
const ALPHABET =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const nanoid7 = customAlphabet(ALPHABET, GENERATED_SLUG_LENGTH);

/** Random slug for anonymous / non-custom links. */
export function generateSlug(): string {
  return nanoid7();
}

export type SlugValidation = { ok: true } | { ok: false; error: string };

/** Validates a user-chosen slug: length, charset, reserved words. */
export function validateCustomSlug(slug: string): SlugValidation {
  if (slug.length < MIN_SLUG_LENGTH) {
    return {
      ok: false,
      error: `Slug must be at least ${MIN_SLUG_LENGTH} characters.`,
    };
  }
  if (slug.length > MAX_SLUG_LENGTH) {
    return {
      ok: false,
      error: `Slug must be at most ${MAX_SLUG_LENGTH} characters.`,
    };
  }
  if (!SLUG_PATTERN.test(slug)) {
    return {
      ok: false,
      error:
        "Slug may only contain letters, numbers, hyphens, and underscores.",
    };
  }
  if (RESERVED_SLUGS.has(slug.toLowerCase())) {
    return { ok: false, error: `"${slug}" is a reserved word.` };
  }
  return { ok: true };
}

/**
 * Loose shape check used by the redirect route to short-circuit requests
 * that cannot possibly be a slug (wrong charset / absurd length) before
 * touching Redis or Postgres.
 */
export function isPlausibleSlug(value: string): boolean {
  return (
    value.length >= 1 &&
    value.length <= MAX_SLUG_LENGTH &&
    SLUG_PATTERN.test(value)
  );
}
