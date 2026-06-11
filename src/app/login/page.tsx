import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(60rem_30rem_at_50%_-10%,rgba(139,92,246,0.18),transparent)]" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-violet-500/5">
          <h1 className="text-lg font-semibold text-white">Welcome back</h1>
          <p className="mb-6 mt-1 text-sm text-slate-400">
            Sign in to manage your links and analytics.
          </p>
          <AuthForm mode="login" />
        </div>
        <p className="mt-5 text-center text-sm text-slate-400">
          No account yet?{" "}
          <Link href="/register" className="font-medium text-violet-300 hover:text-violet-200">
            Create one
          </Link>
        </p>
        <p className="mt-6 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-center text-xs text-slate-500">
          Seeded demo account: <span className="text-slate-300">demo@linkpulse.dev</span> /{" "}
          <span className="text-slate-300">demo-password</span>
        </p>
      </div>
    </main>
  );
}
