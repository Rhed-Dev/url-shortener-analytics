import { after, NextResponse, type NextRequest } from "next/server";
import { cacheLink, getCachedLink, invalidateLink, type CachedLink } from "@/lib/cache";
import { recordClick } from "@/lib/clicks";
import { getDb } from "@/lib/db";
import { checkExpiry } from "@/lib/expiry";
import {
  gonePage,
  notFoundPage,
  serverErrorPage,
  tooManyRequestsPage,
} from "@/lib/html-pages";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";
import { isPlausibleSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

/**
 * The redirect hot path: GET /:slug
 *
 *   rate limit (Redis ZSET) -> cache (Redis GET) -> Postgres fallback
 *   -> lazy expiry check -> 302 + fire-and-forget click recording
 *
 * Click recording is scheduled with `after()`, so the geolocation lookup
 * and the Click INSERT happen after the response is already on the wire.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  try {
    const { slug } = await params;
    if (!isPlausibleSlug(slug)) return html(notFoundPage(), 404);

    // 1. Rate limit before any storage work — cheapest defense first.
    const limited = await enforceRateLimit(req, "redirect");
    if (limited) {
      const retryAfter = Math.max(1, Math.ceil(limited.retryAfterMs / 1000));
      return html(tooManyRequestsPage(retryAfter), 429, {
        "Retry-After": String(retryAfter),
      });
    }

    // 2. Cache-aside: Redis first, Postgres on miss.
    let link: CachedLink | null = await getCachedLink(slug);
    const fromCache = link !== null;
    if (!link) {
      const row = await getDb().link.findUnique({ where: { slug } });
      if (row) {
        link = {
          id: row.id,
          destination: row.destination,
          disabled: row.disabled,
          expiresAt: row.expiresAt?.toISOString() ?? null,
          maxClicks: row.maxClicks,
        };
      }
    }
    if (!link) return html(notFoundPage(), 404);

    if (link.disabled) {
      await invalidateLink(slug);
      return html(notFoundPage(), 404);
    }

    // 3. Lazy expiry. The time check is free; the click-cap check needs a
    //    count, so it only runs for links that actually set maxClicks.
    let clickCount = 0;
    if (link.maxClicks !== null) {
      clickCount = await getDb().click.count({ where: { linkId: link.id } });
    }
    const expiry = checkExpiry(
      {
        expiresAt: link.expiresAt ? new Date(link.expiresAt) : null,
        maxClicks: link.maxClicks,
      },
      clickCount,
    );
    if (expiry.expired) {
      await invalidateLink(slug);
      return html(
        gonePage(expiry.reason === "maxClicks" ? "limit" : "expired"),
        410,
      );
    }

    // 4. Warm the cache on a miss (TTL capped by expiresAt).
    if (!fromCache) await cacheLink(slug, link);

    // 5. Record the click after the response is sent — zero added latency.
    const click = {
      linkId: link.id,
      ip: getClientIp(req),
      userAgent: req.headers.get("user-agent"),
      referrer: req.headers.get("referer"),
    };
    after(() => recordClick(click));

    // 302 (not 301) so browsers don't cache the hop permanently — edits,
    // disables, and expiry need to keep taking effect.
    return NextResponse.redirect(link.destination, 302);
  } catch (err) {
    console.error("[redirect]", err);
    return html(serverErrorPage(), 500);
  }
}

function html(
  body: string,
  status: number,
  headers?: Record<string, string>,
): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", ...headers },
  });
}
