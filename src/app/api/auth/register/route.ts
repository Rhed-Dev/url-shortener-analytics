import { NextResponse, type NextRequest } from "next/server";
import { handleRouteError, jsonError, parseBody } from "@/lib/api";
import {
  createSessionToken,
  hashPassword,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";
import { getDb } from "@/lib/db";
import { registerSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** POST /api/auth/register — create an account and start a session. */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const parsed = await parseBody(req, registerSchema);
    if (!parsed.ok) return parsed.response;
    const { email, password, name } = parsed.data;

    const db = getDb();
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return jsonError(
        409,
        "email_taken",
        "An account with that email already exists.",
      );
    }

    const user = await db.user.create({
      data: { email, name: name ?? null, password: await hashPassword(password) },
    });

    const token = await createSessionToken(user.id);
    const res = NextResponse.json(
      { user: { id: user.id, email: user.email, name: user.name } },
      { status: 201 },
    );
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (err) {
    return handleRouteError(err);
  }
}
