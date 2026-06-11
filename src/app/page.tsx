import Link from "next/link";
import {
  ChartIcon,
  ClockIcon,
  GlobeIcon,
  LinkIcon,
  QrIcon,
  ShieldIcon,
  UsersIcon,
  ZapIcon,
} from "@/components/icons";
import { Logo } from "@/components/Logo";
import { ShortenBox } from "@/components/ShortenBox";

const features = [
  {
    icon: ZapIcon,
    title: "Instant shortening",
    body: "Paste a URL and get a 7-character link in one click — no account needed. Redirects are served from a Redis hot cache.",
  },
  {
    icon: ChartIcon,
    title: "Click analytics",
    body: "A time-series chart, top countries, referrers, and a device split for every link — recorded asynchronously so redirects stay fast.",
  },
  {
    icon: LinkIcon,
    title: "Custom slugs",
    body: "Branded, memorable paths like /launch — validated for charset, length, and reserved words, with uniqueness enforced by the database.",
  },
  {
    icon: QrIcon,
    title: "QR codes",
    body: "Every link ships with a QR code rendered on demand — preview it in the dashboard and download it as PNG or SVG at any size.",
  },
  {
    icon: ClockIcon,
    title: "Link expiration",
    body: "Set an expiry date, a click limit, or both. Dead links answer with an honest 410 Gone — no cron job required.",
  },
  {
    icon: ShieldIcon,
    title: "Abuse-resistant",
    body: "A hand-rolled sliding-window rate limiter on Redis sorted sets throttles per-IP, with proper 429s and Retry-After headers.",
  },
];

const engineering = [
  {
    icon: ZapIcon,
    title: "Cache-aside redirects",
    body: "Hot slugs resolve straight from Redis; Postgres is only consulted on a miss, then the cache is warmed with an expiry-aware TTL.",
  },
  {
    icon: ChartIcon,
    title: "Fire-and-forget analytics",
    body: "Click rows — geo, device, referrer — are written after the 302 is already on the wire, so analytics never tax the redirect.",
  },
  {
    icon: UsersIcon,
    title: "Privacy-first uniques",
    body: "Unique visitors are counted with salted SHA-256 IP hashes. Raw IP addresses are never written to disk.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(70rem_36rem_at_50%_-12rem,rgba(139,92,246,0.22),transparent)]" />

      <header className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="relative">
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Self-hosted · Open source · MIT
          </p>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            Short links,{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              long on insight.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
            Linkpulse shortens your URLs and tells you the story behind every
            click — countries, devices, referrers — with Redis-fast redirects
            and built-in rate limiting.
          </p>
          <div className="mt-10">
            <ShortenBox />
          </div>
          <p className="mt-6 text-xs text-slate-500">
            No tracking pixels · IPs stored only as salted hashes · Your data
            stays in your Postgres
          </p>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Everything a link deserves
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-slate-400">
            From the first paste to the last click — shortening, branding,
            tracking, and retiring links, all in one place.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-violet-500/30 hover:bg-violet-500/[0.05]"
              >
                <div className="inline-flex rounded-xl border border-violet-500/20 bg-violet-500/10 p-2.5 text-violet-300">
                  <f.icon width={20} height={20} />
                </div>
                <h3 className="mt-4 font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Engineering */}
        <section className="border-y border-white/5 bg-white/[0.02]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-center text-2xl font-bold tracking-tight text-white">
              Built for the redirect hot path
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {engineering.map((item, i) => (
                <div key={item.title} className="relative">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <h3 className="font-semibold text-white">{item.title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Ready to own your links?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
            Create an account to unlock custom slugs, analytics dashboards, QR
            codes, and link expiration.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/register"
              className="rounded-lg bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
            >
              Create free account
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-xs text-slate-500 sm:flex-row sm:px-6">
          <span>MIT licensed · Built with Next.js, Prisma, PostgreSQL & Redis</span>
          <span>Linkpulse — a portfolio project by John Rhed Atienza</span>
        </div>
      </footer>
    </div>
  );
}
