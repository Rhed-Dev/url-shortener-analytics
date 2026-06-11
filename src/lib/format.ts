/** Origin used to build short URLs (env first, request origin as fallback). */
export function getBaseUrl(requestOrigin?: string): string {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ?? requestOrigin ?? "http://localhost:3000";
  return base.replace(/\/$/, "");
}

export function shortUrlFor(slug: string, requestOrigin?: string): string {
  return `${getBaseUrl(requestOrigin)}/${slug}`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en", {
    notation: n >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(n);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "https://example.com/very/long/path" -> "https://example.com/ver…path" */
export function truncateMiddle(value: string, max: number): string {
  if (value.length <= max) return value;
  const half = Math.floor((max - 1) / 2);
  return `${value.slice(0, half)}…${value.slice(value.length - half)}`;
}
