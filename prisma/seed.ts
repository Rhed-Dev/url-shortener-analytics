/**
 * Demo seed — one account, a handful of links, and ~30 days of realistic
 * click traffic so the dashboard and analytics pages look alive.
 *
 * Run with: npx prisma db seed   (or: npm run db:seed)
 * Login:    demo@linkpulse.dev / demo-password
 */
import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Deterministic PRNG so re-seeding produces the same demo data.
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);

function weighted<T>(entries: ReadonlyArray<readonly [T, number]>): T {
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = rand() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

const GEO: ReadonlyArray<readonly [{ country: string; city: string }, number]> = [
  [{ country: "United States", city: "San Francisco" }, 22],
  [{ country: "United States", city: "New York" }, 10],
  [{ country: "Philippines", city: "Manila" }, 14],
  [{ country: "Germany", city: "Berlin" }, 9],
  [{ country: "United Kingdom", city: "London" }, 8],
  [{ country: "India", city: "Bengaluru" }, 7],
  [{ country: "Japan", city: "Tokyo" }, 6],
  [{ country: "Brazil", city: "São Paulo" }, 5],
  [{ country: "France", city: "Paris" }, 4],
  [{ country: "Canada", city: "Toronto" }, 4],
  [{ country: "Australia", city: "Sydney" }, 3],
];

const REFERRERS: ReadonlyArray<readonly [string | null, number]> = [
  [null, 34], // direct
  ["github.com", 18],
  ["twitter.com", 14],
  ["news.ycombinator.com", 12],
  ["www.google.com", 10],
  ["www.linkedin.com", 7],
  ["www.reddit.com", 5],
];

const DEVICES: ReadonlyArray<readonly [string, number]> = [
  ["desktop", 58],
  ["mobile", 36],
  ["tablet", 6],
];

const BROWSERS: ReadonlyArray<readonly [string, number]> = [
  ["Chrome", 54],
  ["Safari", 20],
  ["Firefox", 12],
  ["Edge", 9],
  ["Arc", 5],
];

interface ClickRow {
  linkId: string;
  ts: Date;
  country: string;
  city: string;
  referrer: string | null;
  device: string;
  browser: string;
  ipHash: string;
}

function clicksFor(linkId: string, days: number, dailyBase: number): ClickRow[] {
  const rows: ClickRow[] = [];
  // A pool of recurring "visitors" makes unique-visitor counts realistic.
  const visitorPool = Math.max(8, Math.round(dailyBase * days * 0.55));
  for (let day = days - 1; day >= 0; day--) {
    const date = new Date(Date.now() - day * 86_400_000);
    const weekday = date.getUTCDay();
    const weekendDip = weekday === 0 || weekday === 6 ? 0.55 : 1;
    const growth = 0.6 + (0.8 * (days - day)) / days; // gentle upward trend
    const count = Math.round(dailyBase * weekendDip * growth * (0.6 + rand() * 0.8));
    for (let i = 0; i < count; i++) {
      const ts = new Date(date);
      ts.setUTCHours(Math.floor(rand() * 24), Math.floor(rand() * 60), Math.floor(rand() * 60), 0);
      const geo = weighted(GEO);
      const visitor = Math.floor(rand() * visitorPool);
      rows.push({
        linkId,
        ts,
        country: geo.country,
        city: geo.city,
        referrer: weighted(REFERRERS),
        device: weighted(DEVICES),
        browser: weighted(BROWSERS),
        ipHash: createHash("sha256").update(`seed-salt:visitor-${linkId}-${visitor}`).digest("hex"),
      });
    }
  }
  return rows;
}

async function main(): Promise<void> {
  console.log("Clearing existing data…");
  await prisma.click.deleteMany();
  await prisma.link.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating demo user…");
  const user = await prisma.user.create({
    data: {
      email: "demo@linkpulse.dev",
      name: "Demo User",
      password: await bcrypt.hash("demo-password", 10),
    },
  });

  console.log("Creating links…");
  const gh = await prisma.link.create({
    data: { slug: "gh", destination: "https://github.com", userId: user.id },
  });
  const nextDocs = await prisma.link.create({
    data: {
      slug: "next-docs",
      destination: "https://nextjs.org/docs",
      userId: user.id,
    },
  });
  const beta = await prisma.link.create({
    data: {
      slug: "beta",
      destination: "https://tailwindcss.com/docs/installation",
      userId: user.id,
      maxClicks: 250,
    },
  });
  const tailwind = await prisma.link.create({
    data: {
      slug: "redis-rl",
      destination: "https://redis.io/glossary/rate-limiting/",
      userId: user.id,
    },
  });
  await prisma.link.create({
    data: {
      slug: "launch",
      destination: "https://www.producthunt.com",
      userId: user.id,
      // Already expired — demonstrates the branded 410 page.
      expiresAt: new Date(Date.now() - 3 * 86_400_000),
    },
  });
  // Anonymous quick-shortens (no owner)
  await prisma.link.create({
    data: { slug: "x9Kp2Qa", destination: "https://www.postgresql.org/docs/current/" },
  });
  await prisma.link.create({
    data: { slug: "fT3mWv8", destination: "https://vitest.dev" },
  });

  console.log("Generating click traffic…");
  const clicks: ClickRow[] = [
    ...clicksFor(gh.id, 30, 18),
    ...clicksFor(nextDocs.id, 30, 11),
    ...clicksFor(beta.id, 21, 5),
    ...clicksFor(tailwind.id, 14, 7),
  ];
  // Insert in chunks to stay clear of parameter limits.
  for (let i = 0; i < clicks.length; i += 500) {
    await prisma.click.createMany({ data: clicks.slice(i, i + 500) });
  }

  console.log(`Seeded 1 user, 7 links, ${clicks.length} clicks.`);
  console.log("Login with demo@linkpulse.dev / demo-password");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
