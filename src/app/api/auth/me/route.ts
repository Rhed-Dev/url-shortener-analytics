import { NextResponse } from "next/server";
import { handleRouteError, jsonError } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/auth/me — the currently signed-in user, if any. */
export async function GET(): Promise<NextResponse> {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError(401, "auth_required", "Not signed in.");
    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
