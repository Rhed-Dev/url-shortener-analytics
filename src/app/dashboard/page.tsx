import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { toLinkDTO } from "@/lib/links";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const links = await getDb().link.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { clicks: true } } },
  });

  return (
    <>
      <AppNav email={user.email} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <DashboardClient initialLinks={links.map((link) => toLinkDTO(link))} />
      </main>
    </>
  );
}
