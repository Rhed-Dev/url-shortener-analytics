import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(60rem_30rem_at_50%_-10%,rgba(139,92,246,0.18),transparent)]" />
      <LogoMark size={40} />
      <p className="mt-8 bg-gradient-to-br from-violet-300 to-fuchsia-400 bg-clip-text text-7xl font-extrabold tracking-tighter text-transparent">
        404
      </p>
      <h1 className="mt-3 text-xl font-semibold text-white">
        This page does not exist
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
        The page you are looking for was moved, deleted, or never existed in
        the first place.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400"
      >
        Back to Linkpulse
      </Link>
    </main>
  );
}
