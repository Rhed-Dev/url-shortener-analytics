import { NextResponse, type NextRequest } from "next/server";
import { handleRouteError, jsonError, parseQuery } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getLinkStats } from "@/lib/stats";
import { statsQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** GET /api/links/:id/stats?days=30 — analytics aggregates for one link. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError(401, "auth_required", "Sign in required.");

    const { id } = await params;
    const link = await getDb().link.findUnique({ where: { id } });
    if (!link || link.userId !== user.id) {
      return jsonError(404, "not_found", "Link not found.");
    }

    const query = parseQuery(req.nextUrl.searchParams, statsQuerySchema);
    if (!query.ok) return query.response;

    const stats = await getLinkStats(link.id, query.data.days);
    return NextResponse.json({ stats });
  } catch (err) {
    return handleRouteError(err);
  }
}
