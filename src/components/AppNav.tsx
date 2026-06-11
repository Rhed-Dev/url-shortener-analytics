import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";

/** Top navigation for authenticated pages. */
export function AppNav({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo href="/dashboard" />
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-slate-400 sm:block">{email}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
