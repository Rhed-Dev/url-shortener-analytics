import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(60rem_30rem_at_50%_-10%,rgba(139,92,246,0.18),transparent)]" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-violet-500/5">
          <h1 className="text-lg font-semibold text-white">Create your account</h1>
          <p className="mb-6 mt-1 text-sm text-slate-400">
            Unlock custom slugs, analytics, QR codes, and link expiration.
          </p>
          <AuthForm mode="register" />
        </div>
        <p className="mt-5 text-center text-sm text-slate-400">
          Already registered?{" "}
          <Link href="/login" className="font-medium text-violet-300 hover:text-violet-200">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
