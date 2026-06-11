import { getDb } from "./db";

export interface SeriesPoint {
  /** UTC day, "YYYY-MM-DD". */
  date: string;
  clicks: number;
}

export interface BreakdownRow {
  label: string;
  clicks: number;
}

export interface LinkStats {
  totalClicks: number;
  uniqueVisitors: number;
  days: number;
  series: SeriesPoint[];
  countries: BreakdownRow[];
  referrers: BreakdownRow[];
  devices: BreakdownRow[];
  browsers: BreakdownRow[];
}

type GroupField = "country" | "referrer" | "device" | "browser";

const dayKey = (d: Date): string => d.toISOString().slice(0, 10);

async function breakdown(
  linkId: string,
  since: Date,
  field: GroupField,
  fallbackLabel: string,
  take: number,
): Promise<BreakdownRow[]> {
  const rows = await getDb().click.groupBy({
    by: [field],
    where: { linkId, ts: { gte: since } },
    _count: { _all: true },
    orderBy: { _count: { [field]: "desc" } },
    take,
  });
  return rows.map((row) => ({
    label: row[field] ?? fallbackLabel,
    clicks: row._count._all,
  }));
}

/** Aggregates everything the analytics page needs for one link. */
export async function getLinkStats(
  linkId: string,
  days: number,
): Promise<LinkStats> {
  const db = getDb();
  const since = new Date(Date.now() - days * 86_400_000);

  const [totalClicks, uniqueRows, countries, referrers, devices, browsers, recent] =
    await Promise.all([
      db.click.count({ where: { linkId } }),
      db.click.groupBy({ by: ["ipHash"], where: { linkId } }),
      breakdown(linkId, since, "country", "Unknown", 8),
      breakdown(linkId, since, "referrer", "Direct", 8),
      breakdown(linkId, since, "device", "Unknown", 4),
      breakdown(linkId, since, "browser", "Other", 6),
      db.click.findMany({
        where: { linkId, ts: { gte: since } },
        select: { ts: true },
      }),
    ]);

  // Bucket clicks per UTC day, zero-filling so the chart has no gaps.
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    buckets.set(dayKey(new Date(Date.now() - i * 86_400_000)), 0);
  }
  for (const click of recent) {
    const key = dayKey(click.ts);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const series: SeriesPoint[] = Array.from(buckets, ([date, clicks]) => ({
    date,
    clicks,
  }));

  return {
    totalClicks,
    uniqueVisitors: uniqueRows.length,
    days,
    series,
    countries,
    referrers,
    devices,
    browsers,
  };
}
