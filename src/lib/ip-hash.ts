import { createHash } from "node:crypto";
import { requireEnv } from "./env";

/**
 * Privacy-preserving visitor identity.
 *
 * Unique-visitor counts need a stable per-visitor key, but storing raw IPs
 * is a PII liability. Instead we store `SHA-256(salt + ":" + ip)`:
 *
 * - deterministic, so repeat visits from the same IP collapse to one visitor;
 * - one-way, so the database alone cannot reveal an address;
 * - salted with a server-side secret, so precomputed rainbow tables of the
 *   (small) IPv4 space are useless without the salt.
 */
export function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export function hashIpWithEnvSalt(ip: string): string {
  return hashIp(ip, requireEnv("IP_HASH_SALT"));
}
