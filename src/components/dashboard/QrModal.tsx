"use client";

import { useState } from "react";
import { DownloadIcon } from "@/components/icons";
import { Modal } from "@/components/ui/Modal";
import { Label, secondaryButtonClass } from "@/components/ui/fields";
import type { LinkDTO } from "@/lib/links";

const SIZES = [256, 320, 512, 1024] as const;

export function QrModal({ link, onClose }: { link: LinkDTO | null; onClose: () => void }) {
  const [size, setSize] = useState<number>(320);

  if (!link) return <Modal open={false} onClose={onClose} title="QR code">{null}</Modal>;

  const qrBase = `/api/links/${link.id}/qr`;

  return (
    <Modal open onClose={onClose} title={`QR code for /${link.slug}`} widthClass="max-w-md">
      <div className="flex flex-col items-center">
        <div className="overflow-hidden rounded-xl bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${qrBase}?format=png&size=${size}`}
            alt={`QR code pointing to ${link.shortUrl}`}
            width={224}
            height={224}
            className="h-56 w-56"
          />
        </div>
        <p className="mt-3 text-sm text-slate-400">{link.shortUrl}</p>

        <div className="mt-5 w-full">
          <Label htmlFor="qr-size">Download size</Label>
          <select
            id="qr-size"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-400/60"
          >
            {SIZES.map((s) => (
              <option key={s} value={s} className="bg-slate-900">
                {s} × {s} px
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex w-full gap-2">
          <a
            href={`${qrBase}?format=png&size=${size}&download=1`}
            className={`${secondaryButtonClass} flex-1`}
            download
          >
            <DownloadIcon width={15} height={15} />
            PNG
          </a>
          <a
            href={`${qrBase}?format=svg&size=${size}&download=1`}
            className={`${secondaryButtonClass} flex-1`}
            download
          >
            <DownloadIcon width={15} height={15} />
            SVG
          </a>
        </div>
      </div>
    </Modal>
  );
}
