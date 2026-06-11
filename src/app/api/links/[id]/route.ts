import { NextResponse, type NextRequest } from "next/server";
import type { Link } from "@prisma/client";
import { handleRouteError, jsonError, parseBody, type ApiErrorBody } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { invalidateLink } from "@/lib/cache";
import { getDb } from "@/lib/db";
import { toLinkDTO } from "@/lib/links";
import { updateLinkSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Loads a link only if the current session owns it. Unowned and missing
 * links both return 404 so link ids cannot be probed for existence.
 */
async function findOwnedLink(
  id: string,
): Promise<{ ok: true; link: Link } | { ok: false; response: NextResponse<ApiErrorBody> }> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, response: jsonError(401, "auth_required", "Sign in required.") };
  }
  const link = await getDb().link.findUnique({ where: { id } });
  if (!link || link.userId !== user.id) {
    return { ok: false, response: jsonError(404, "not_found", "Link not found.") };
  }
  return { ok: true, link };
}

/** PATCH /api/links/:id — edit destination, expiry, click limit, disabled. */
export async function PATCH(req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const { id } = await params;
    const owned = await findOwnedLink(id);
    if (!owned.ok) return owned.response;

    const parsed = await parseBody(req, updateLinkSchema);
    if (!parsed.ok) return parsed.response;
    const { destination, disabled, expiresAt, maxClicks } = parsed.data;

    const updated = await getDb().link.update({
      where: { id },
      data: {
        ...(destination !== undefined ? { destination } : {}),
        ...(disabled !== undefined ? { disabled } : {}),
        ...(expiresAt !== undefined
          ? { expiresAt: expiresAt === null ? null : new Date(expiresAt) }
          : {}),
        ...(maxClicks !== undefined ? { maxClicks } : {}),
      },
      include: { _count: { select: { clicks: true } } },
    });

    // The cached copy is stale the moment the row changes.
    await invalidateLink(updated.slug);

    return NextResponse.json({ link: toLinkDTO(updated, req.nextUrl.origin) });
  } catch (err) {
    return handleRouteError(err);
  }
}

/** DELETE /api/links/:id — remove the link and (via cascade) its clicks. */
export async function DELETE(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const { id } = await params;
    const owned = await findOwnedLink(id);
    if (!owned.ok) return owned.response;

    await getDb().link.delete({ where: { id } });
    await invalidateLink(owned.link.slug);

    return NextResponse.json({ deleted: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
