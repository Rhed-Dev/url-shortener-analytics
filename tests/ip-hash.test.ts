import { describe, expect, it } from "vitest";
import { hashIp } from "../src/lib/ip-hash";

describe("hashIp", () => {
  it("is deterministic — same IP and salt give the same hash", () => {
    expect(hashIp("203.0.113.7", "salt-a")).toBe(hashIp("203.0.113.7", "salt-a"));
  });

  it("produces a 64-character lowercase hex digest (SHA-256)", () => {
    expect(hashIp("203.0.113.7", "salt-a")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("differs for different IPs", () => {
    expect(hashIp("203.0.113.7", "salt-a")).not.toBe(hashIp("203.0.113.8", "salt-a"));
  });

  it("differs for different salts — leaked hashes are useless without the salt", () => {
    expect(hashIp("203.0.113.7", "salt-a")).not.toBe(hashIp("203.0.113.7", "salt-b"));
  });

  it("never contains the raw IP", () => {
    const ip = "203.0.113.7";
    expect(hashIp(ip, "salt-a")).not.toContain(ip);
  });

  it("handles IPv6 addresses", () => {
    const hash = hashIp("2001:db8::8a2e:370:7334", "salt-a");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(hashIp("2001:db8::8a2e:370:7334", "salt-a"));
  });
});
