import { IpApiProvider } from "./ip-api";
import type { GeoProvider } from "./types";

export type { GeoLocation, GeoProvider } from "./types";

class NullGeoProvider implements GeoProvider {
  readonly name = "none";

  async lookup(): Promise<null> {
    return null;
  }
}

const PRIVATE_IP_PATTERN =
  /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1$|fc|fd)/i;

/** Local / private addresses are skipped — they have no meaningful geo. */
export function isPrivateIp(ip: string): boolean {
  return PRIVATE_IP_PATTERN.test(ip);
}

let provider: GeoProvider | undefined;

/** Provider selected by GEO_PROVIDER ("ip-api" default, "none" disables). */
export function getGeoProvider(): GeoProvider {
  if (!provider) {
    provider =
      process.env.GEO_PROVIDER === "none"
        ? new NullGeoProvider()
        : new IpApiProvider();
  }
  return provider;
}
