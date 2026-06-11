import { NextResponse, type NextRequest } from "next/server";
import { handleRouteError, jsonError, parseBody } from "@/lib/api";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";
import { getDb } from "@/lib/db";
import { loginSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** POST /api/auth/login — verify credentials and start a session. */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const parsed = await parseBody(req, loginSchema);
    if (!parsed.ok) return parsed.response;
    const { email, password } = parsed.data;

    const user = await getDb().user.findUnique({ where: { email } });
    // One generic message for both cases — no account enumeration.
    if (!user || !(await verifyPassword(password, user.password))) {
      return jsonError(401, "invalid_credentials", "Invalid email or password.");
    }

    const token = await createSessionToken(user.id);
    const res = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (err) {
    return handleRouteError(err);
  }
}
