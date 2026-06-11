import { NextResponse, type NextRequest } from "next/server";
import { handleRouteError, jsonError, parseBody, rateLimitResponse } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { createLinkWithUniqueSlug, toLinkDTO } from "@/lib/links";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createLinkSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * POST /api/links — create a short link.
 * Anonymous visitors get a random slug; signed-in users can add a custom
 * slug, an expiry date, and a click limit.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const limited = await enforceRateLimit(req, "create");
    if (limited) return rateLimitResponse(limited);

    const parsed = await parseBody(req, createLinkSchema);
    if (!parsed.ok) return parsed.response;
    const { url, slug, expiresAt, maxClicks } = parsed.data;

    const user = await getSessionUser();
    if (!user && (slug || expiresAt || maxClicks !== undefined)) {
      return jsonError(
        401,
        "auth_required",
        "Sign in to use custom slugs, expiry dates, or click limits.",
      );
    }

    const result = await createLinkWithUniqueSlug({
      destination: url,
      userId: user?.id ?? null,
      slug,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      maxClicks: maxClicks ?? null,
    });

    if (!result.ok) {
      return result.error === "slug_taken"
        ? jsonError(409, "slug_taken", "That slug is already in use — try another.")
        : jsonError(
            500,
            "slug_generation_failed",
            "Could not generate a unique slug. Please try again.",
          );
    }

    return NextResponse.json(
      { link: toLinkDTO(result.link, req.nextUrl.origin) },
      { status: 201 },
    );
  } catch (err) {
    return handleRouteError(err);
  }
}

/** GET /api/links — list the signed-in user's links, newest first. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError(401, "auth_required", "Sign in required.");

    const links = await getDb().link.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { clicks: true } } },
    });

    return NextResponse.json({
      links: links.map((link) => toLinkDTO(link, req.nextUrl.origin)),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
