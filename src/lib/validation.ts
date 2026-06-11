import { z } from "zod";
import { validateCustomSlug } from "./slug";

/**
 * Zod schemas for every API boundary. Handlers never touch unvalidated
 * request bodies or query strings.
 */

const httpUrl = z
  .string()
  .trim()
  .min(1, "URL is required.")
  .max(2048, "URL is too long (max 2048 characters).")
  .url("Enter a valid URL, including http:// or https://.")
  .refine(
    (value) => value.startsWith("http://") || value.startsWith("https://"),
    "Only http(s) URLs can be shortened.",
  );

const customSlug = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    const result = validateCustomSlug(value);
    if (!result.ok) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.error });
    }
  });

const isoDatetime = z.string().datetime({
  offset: true,
  message: "Expiry must be an ISO 8601 datetime.",
});

const maxClicksValue = z
  .number()
  .int("Click limit must be a whole number.")
  .min(1, "Click limit must be at least 1.")
  .max(1_000_000, "Click limit is too large.");

export const createLinkSchema = z.object({
  url: httpUrl,
  slug: customSlug.optional(),
  expiresAt: isoDatetime
    .optional()
    .refine(
      (value) => !value || new Date(value).getTime() > Date.now(),
      "Expiry must be in the future.",
    ),
  maxClicks: maxClicksValue.optional(),
});

export const updateLinkSchema = z
  .object({
    destination: httpUrl.optional(),
    disabled: z.boolean().optional(),
    expiresAt: isoDatetime.nullable().optional(),
    maxClicks: maxClicksValue.nullable().optional(),
  })
  .refine(
    (value) => Object.values(value).some((v) => v !== undefined),
    "Provide at least one field to update.",
  );

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address.")
    .max(254),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must be at most 72 characters."),
  name: z.string().trim().min(1).max(60).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email.").max(254),
  password: z.string().min(1, "Password is required.").max(72),
});

export const qrQuerySchema = z.object({
  format: z.enum(["png", "svg"]).default("png"),
  size: z.coerce.number().int().min(128).max(1024).default(320),
  download: z.string().optional(),
});

export const statsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(30),
});
