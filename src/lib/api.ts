import { NextResponse } from "next/server";
import type { z } from "zod";
import type { RateLimitResult } from "./rate-limit/limiter";

/** Uniform error envelope: { error: { code, message, details? } } */
export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
  headers?: Record<string, string>,
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { error: { code, message, ...(details !== undefined ? { details } : {}) } },
    { status, headers },
  );
}

/** 429 with a Retry-After header derived from the sliding window. */
export function rateLimitResponse(
  result: RateLimitResult,
): NextResponse<ApiErrorBody> {
  const retryAfterSeconds = Math.max(1, Math.ceil(result.retryAfterMs / 1000));
  return jsonError(
    429,
    "rate_limited",
    `Too many requests — try again in ${retryAfterSeconds}s.`,
    { limit: result.limit, retryAfterSeconds },
    { "Retry-After": String(retryAfterSeconds) },
  );
}

/** Last-resort handler so route handlers never leak stack traces. */
export function handleRouteError(err: unknown): NextResponse<ApiErrorBody> {
  const message = err instanceof Error ? err.message : "Unexpected error";
  if (message.startsWith("Missing required environment variable")) {
    return jsonError(500, "config_error", message);
  }
  console.error("[api]", err);
  return jsonError(500, "internal_error", "Something went wrong. Please try again.");
}

export type ParsedBody<S extends z.ZodTypeAny> =
  | { ok: true; data: z.infer<S> }
  | { ok: false; response: NextResponse<ApiErrorBody> };

/** Parse + validate a JSON body. Returns a ready 400/422 on failure. */
export async function parseBody<S extends z.ZodTypeAny>(
  req: Request,
  schema: S,
): Promise<ParsedBody<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      ok: false,
      response: jsonError(400, "invalid_json", "Request body must be valid JSON."),
    };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      response: jsonError(
        422,
        "validation_error",
        parsed.error.issues[0]?.message ?? "Invalid input.",
        parsed.error.flatten().fieldErrors,
      ),
    };
  }
  return { ok: true, data: parsed.data };
}

/** Same idea for query strings. */
export function parseQuery<S extends z.ZodTypeAny>(
  searchParams: URLSearchParams,
  schema: S,
): ParsedBody<S> {
  const parsed = schema.safeParse(Object.fromEntries(searchParams.entries()));
  if (!parsed.success) {
    return {
      ok: false,
      response: jsonError(
        422,
        "validation_error",
        parsed.error.issues[0]?.message ?? "Invalid query parameters.",
        parsed.error.flatten().fieldErrors,
      ),
    };
  }
  return { ok: true, data: parsed.data };
}
