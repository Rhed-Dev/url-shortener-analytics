import type { GeoLocation, GeoProvider } from "./types";

interface IpApiResponse {
  status?: string;
  country?: string;
  city?: string;
}

/**
 * GeoProvider backed by ip-api.com — free, no API key, 45 req/min on the
 * free tier. Lookups run AFTER the redirect response has been sent (see
 * recordClick), so the timeout here protects the click worker, not the
 * visitor's latency.
 */
export class IpApiProvider implements GeoProvider {
  readonly name = "ip-api";

  constructor(private readonly timeoutMs: number = 1500) {}

  async lookup(ip: string): Promise<GeoLocation | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(
        `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,city`,
        { signal: controller.signal, cache: "no-store" },
      );
      if (!res.ok) return null;
      const data = (await res.json()) as IpApiResponse;
      if (data.status !== "success") return null;
      return { country: data.country ?? null, city: data.city ?? null };
    } catch {
      // Geo data is best-effort; a failed lookup must never fail a click.
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}
