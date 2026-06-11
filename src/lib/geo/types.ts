export interface GeoLocation {
  country: string | null;
  city: string | null;
}

/**
 * Abstraction over IP geolocation so the concrete service is swappable
 * (ip-api.com today; MaxMind, ipinfo, or a local GeoIP database tomorrow)
 * without touching the click-recording pipeline.
 */
export interface GeoProvider {
  readonly name: string;
  lookup(ip: string): Promise<GeoLocation | null>;
}
