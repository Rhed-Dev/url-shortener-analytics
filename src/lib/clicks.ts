import UAParser from "ua-parser-js";
import { getDb } from "./db";
import { getGeoProvider, isPrivateIp } from "./geo";
import { hashIpWithEnvSalt } from "./ip-hash";

export interface ClickContext {
  linkId: string;
  ip: string;
  userAgent: string | null;
  referrer: string | null;
}

/**
 * Record one click.
 *
 * Designed to run AFTER the redirect response has been sent — the route
 * schedules it with `after()` from next/server — so the geolocation HTTP
 * call and the Postgres insert add zero latency to the redirect itself.
 *
 * Never throws: analytics are best-effort and must not break redirects.
 */
export async function recordClick(ctx: ClickContext): Promise<void> {
  try {
    const ua = new UAParser(ctx.userAgent ?? "");
    // ua-parser-js leaves `device.type` undefined for desktop browsers.
    const device = ua.getDevice().type ?? (ctx.userAgent ? "desktop" : null);
    const browser = ua.getBrowser().name ?? null;

    const geo = isPrivateIp(ctx.ip)
      ? null
      : await getGeoProvider().lookup(ctx.ip);

    await getDb().click.create({
      data: {
        linkId: ctx.linkId,
        ipHash: hashIpWithEnvSalt(ctx.ip),
        country: geo?.country ?? null,
        city: geo?.city ?? null,
        referrer: normalizeReferrer(ctx.referrer),
        device,
        browser,
      },
    });
  } catch (err) {
    console.warn(`[clicks] failed to record click: ${(err as Error).message}`);
  }
}

/** Store only the referrer hostname — full URLs can carry tokens and PII. */
function normalizeReferrer(referrer: string | null): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname || null;
  } catch {
    return null;
  }
}
