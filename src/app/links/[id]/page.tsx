import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { BreakdownList } from "@/components/analytics/BreakdownList";
import { ClicksChart } from "@/components/analytics/ClicksChart";
import { DeviceDonut } from "@/components/analytics/DeviceDonut";
import { QrPanel } from "@/components/analytics/QrPanel";
import { ExternalIcon } from "@/components/icons";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatDate, formatNumber, shortUrlFor, truncateMiddle } from "@/lib/format";
import { getLinkStats } from "@/lib/stats";

export const metadata: Metadata = { title: "Link analytics" };
export const dynamic = "force-dynamic";

export default async function LinkAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const link = await getDb().link.findUnique({ where: { id } });
  if (!link || link.userId !== user.id) notFound();

  const stats = await getLinkStats(link.id, 30);
  const shortUrl = shortUrlFor(link.slug);

  const cards = [
    { label: "Total clicks", value: formatNumber(stats.totalClicks) },
    { label: "Unique visitors", value: formatNumber(stats.uniqueVisitors) },
    {
      label: "Click limit",
      value:
        link.maxClicks !== null
          ? `${formatNumber(stats.totalClicks)} / ${formatNumber(link.maxClicks)}`
          : "None",
    },
    {
      label: "Expires",
      value: link.expiresAt ? formatDate(link.expiresAt.toISOString()) : "Never",
    },
  ];

  return (
    <>
      <AppNav email={user.email} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link
          href="/dashboard"
          className="text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to dashboard
        </Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              /{link.slug}
            </h1>
            <a
              href={link.destination}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
            >
              {truncateMiddle(link.destination, 64)}
              <ExternalIcon width={12} height={12} />
            </a>
          </div>
          <p className="text-sm text-slate-500">
            Created {formatDate(link.createdAt.toISOString())} · last{" "}
            {stats.days} days shown
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-white">{card.value}</p>
            </div>
          ))}
        </div>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="mb-4 font-semibold text-white">Clicks over time</h2>
          <ClicksChart series={stats.series} />
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-4 font-semibold text-white">Top countries</h2>
            <BreakdownList rows={stats.countries} emptyLabel="No geo data yet." />
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-4 font-semibold text-white">Devices</h2>
            <DeviceDonut data={stats.devices} />
            <h2 className="mb-4 mt-8 font-semibold text-white">Browsers</h2>
            <BreakdownList
              rows={stats.browsers}
              emptyLabel="No browser data yet."
              barClass="from-sky-500/80 to-violet-500/60"
            />
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-4 font-semibold text-white">Referrers</h2>
            <BreakdownList
              rows={stats.referrers}
              emptyLabel="No referrer data yet."
              barClass="from-fuchsia-500/80 to-violet-500/60"
            />
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-4 font-semibold text-white">QR code</h2>
            <QrPanel linkId={link.id} shortUrl={shortUrl} />
          </section>
        </div>
      </main>
    </>
  );
}
