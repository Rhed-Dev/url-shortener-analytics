/**
 * Environment helpers.
 *
 * Nothing in this module reads env vars at import time — values are resolved
 * at the point of use so the app can be BUILT with no environment configured
 * (CI, fresh clones) and fails with a helpful message only when a runtime
 * code path actually needs the value.
 */

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        `Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}

export function envString(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
}
