import { type NextRequest } from "next/server";
import QRCode from "qrcode";
import { handleRouteError, jsonError, parseQuery } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { shortUrlFor } from "@/lib/format";
import { qrQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * GET /api/links/:id/qr?format=png|svg&size=320&download=1
 * Renders a QR code that encodes the link's short URL.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError(401, "auth_required", "Sign in required.");

    const { id } = await params;
    const link = await getDb().link.findUnique({ where: { id } });
    if (!link || link.userId !== user.id) {
      return jsonError(404, "not_found", "Link not found.");
    }

    const query = parseQuery(req.nextUrl.searchParams, qrQuerySchema);
    if (!query.ok) return query.response;
    const { format, size, download } = query.data;

    const shortUrl = shortUrlFor(link.slug, req.nextUrl.origin);
    const qrOptions = {
      width: size,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    };

    const headers: Record<string, string> = {
      "cache-control": "private, max-age=3600",
    };
    if (download === "1") {
      headers["content-disposition"] =
        `attachment; filename="${link.slug}-qr.${format}"`;
    }

    if (format === "svg") {
      const svg = await QRCode.toString(shortUrl, { ...qrOptions, type: "svg" });
      return new Response(svg, {
        headers: { ...headers, "content-type": "image/svg+xml" },
      });
    }

    const png = await QRCode.toBuffer(shortUrl, { ...qrOptions, type: "png" });
    return new Response(new Uint8Array(png), {
      headers: { ...headers, "content-type": "image/png" },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
