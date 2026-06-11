"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRightIcon, CheckIcon, CopyIcon, SpinnerIcon } from "@/components/icons";
import { inputClass, primaryButtonClass } from "@/components/ui/fields";
import type { LinkDTO } from "@/lib/links";

interface ApiError {
  error?: { code?: string; message?: string };
}

/** The landing-page hero: paste a URL, get a short link instantly. */
export function ShortenBox() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LinkDTO | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const body = (await res.json()) as ApiError & { link?: LinkDTO };
      if (!res.ok || !body.link) {
        setError(body.error?.message ?? "Could not shorten that URL.");
        return;
      }
      setResult(body.link);
      setUrl("");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not access the clipboard.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form
        onSubmit={submit}
        className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-2xl shadow-violet-500/10 backdrop-blur sm:flex-row"
      >
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://paste-a-very-long-url.example.com/like/this/one"
          aria-label="URL to shorten"
          className={`${inputClass} flex-1 border-0 bg-transparent px-3 py-3 text-base focus:ring-0`}
        />
        <button type="submit" disabled={loading} className={`${primaryButtonClass} px-6 py-3`}>
          {loading ? <SpinnerIcon width={16} height={16} /> : null}
          {loading ? "Shortening…" : "Shorten it"}
        </button>
      </form>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-rose-400">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-4 animate-fade-in rounded-2xl border border-violet-500/25 bg-violet-500/[0.07] p-4 text-left">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-violet-300/80">
                Your short link
              </p>
              <a
                href={result.shortUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block truncate text-lg font-semibold text-white hover:text-violet-300"
              >
                {result.shortUrl.replace(/^https?:\/\//, "")}
              </a>
              <p className="mt-1 truncate text-xs text-slate-400">
                → {result.destination}
              </p>
            </div>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
            >
              {copied ? (
                <CheckIcon width={15} height={15} className="text-emerald-400" />
              ) : (
                <CopyIcon width={15} height={15} />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-3 border-t border-white/5 pt-3 text-[13px] text-slate-400">
            Want a custom slug, click analytics, and a QR code for this link?{" "}
            <Link
              href="/register"
              className="inline-flex items-center gap-1 font-medium text-violet-300 hover:text-violet-200"
            >
              Create a free account
              <ArrowRightIcon width={13} height={13} />
            </Link>
          </p>
        </div>
      ) : null}
    </div>
  );
}
