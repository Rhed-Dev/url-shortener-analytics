import { Prisma, type Link } from "@prisma/client";
import { getDb } from "./db";
import { shortUrlFor } from "./format";
import { generateSlug } from "./slug";

/** JSON-safe link shape shared by API responses and client components. */
export interface LinkDTO {
  id: string;
  slug: string;
  shortUrl: string;
  destination: string;
  disabled: boolean;
  expiresAt: string | null;
  maxClicks: number | null;
  createdAt: string;
  clickCount: number;
}

export function toLinkDTO(
  link: Link & { _count?: { clicks: number } },
  requestOrigin?: string,
): LinkDTO {
  return {
    id: link.id,
    slug: link.slug,
    shortUrl: shortUrlFor(link.slug, requestOrigin),
    destination: link.destination,
    disabled: link.disabled,
    expiresAt: link.expiresAt?.toISOString() ?? null,
    maxClicks: link.maxClicks,
    createdAt: link.createdAt.toISOString(),
    clickCount: link._count?.clicks ?? 0,
  };
}

export interface CreateLinkInput {
  destination: string;
  userId: string | null;
  slug?: string;
  expiresAt?: Date | null;
  maxClicks?: number | null;
}

export type CreateLinkResult =
  | { ok: true; link: Link }
  | { ok: false; error: "slug_taken" | "slug_generation_failed" };

function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}

/**
 * Creates a link. Custom slugs surface a 409-able "slug_taken"; generated
 * slugs retry on the (vanishingly rare) nanoid collision. Uniqueness is
 * ultimately enforced by the DB constraint, so concurrent creates are safe.
 */
export async function createLinkWithUniqueSlug(
  input: CreateLinkInput,
): Promise<CreateLinkResult> {
  const db = getDb();
  const data = {
    destination: input.destination,
    userId: input.userId,
    expiresAt: input.expiresAt ?? null,
    maxClicks: input.maxClicks ?? null,
  };

  if (input.slug) {
    try {
      const link = await db.link.create({ data: { ...data, slug: input.slug } });
      return { ok: true, link };
    } catch (err) {
      if (isUniqueViolation(err)) return { ok: false, error: "slug_taken" };
      throw err;
    }
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const link = await db.link.create({
        data: { ...data, slug: generateSlug() },
      });
      return { ok: true, link };
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
    }
  }
  return { ok: false, error: "slug_generation_failed" };
}
