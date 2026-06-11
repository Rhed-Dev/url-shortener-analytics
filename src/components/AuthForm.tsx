"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { SpinnerIcon } from "@/components/icons";
import { FormError, Input, Label, primaryButtonClass } from "@/components/ui/fields";

interface ApiError {
  error?: { message?: string };
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          mode === "register"
            ? { email, password, ...(name.trim() ? { name } : {}) }
            : { email, password },
        ),
      });
      if (!res.ok) {
        const body = (await res.json()) as ApiError;
        setError(body.error?.message ?? "Something went wrong.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormError message={error} />
      {mode === "register" ? (
        <div>
          <Label htmlFor="name">Name (optional)</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ada Lovelace"
            maxLength={60}
          />
        </div>
      ) : null}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={mode === "register" ? 8 : 1}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
        />
      </div>
      <button type="submit" disabled={loading} className={`${primaryButtonClass} w-full py-2.5`}>
        {loading ? <SpinnerIcon width={15} height={15} /> : null}
        {mode === "register" ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
