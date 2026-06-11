"use client";

import { useState } from "react";
import { DownloadIcon } from "@/components/icons";
import { secondaryButtonClass } from "@/components/ui/fields";

const SIZES = [256, 320, 512, 1024] as const;

/** QR preview + size selector + PNG/SVG download for the analytics page. */
export function QrPanel({ linkId, shortUrl }: { linkId: string; shortUrl: string }) {
  const [size, setSize] = useState<number>(320);
  const qrBase = `/api/links/${linkId}/qr`;

  return (
    <div className="flex flex-col items-center">
      <div className="rounded-xl bg-white p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${qrBase}?format=png&size=${size}`}
          alt={`QR code pointing to ${shortUrl}`}
          width={176}
          height={176}
          className="h-44 w-44"
        />
      </div>
      <select
        aria-label="QR download size"
        value={size}
        onChange={(e) => setSize(Number(e.target.value))}
        className="mt-4 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-400/60"
      >
        {SIZES.map((s) => (
          <option key={s} value={s} className="bg-slate-900">
            {s} × {s} px
          </option>
        ))}
      </select>
      <div className="mt-3 flex w-full gap-2">
        <a
          href={`${qrBase}?format=png&size=${size}&download=1`}
          className={`${secondaryButtonClass} flex-1`}
          download
        >
          <DownloadIcon width={14} height={14} />
          PNG
        </a>
        <a
          href={`${qrBase}?format=svg&size=${size}&download=1`}
          className={`${secondaryButtonClass} flex-1`}
          download
        >
          <DownloadIcon width={14} height={14} />
          SVG
        </a>
      </div>
    </div>
  );
}
