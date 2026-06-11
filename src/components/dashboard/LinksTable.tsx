"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ChartIcon,
  CheckIcon,
  CopyIcon,
  ExternalIcon,
  LinkIcon,
  PencilIcon,
  PowerIcon,
  QrIcon,
  TrashIcon,
} from "@/components/icons";
import { formatDate, formatNumber, truncateMiddle } from "@/lib/format";
import type { LinkDTO } from "@/lib/links";
import { linkStatus, statusStyles } from "./link-status";

interface LinksTableProps {
  links: LinkDTO[];
  onCopy: () => void;
  onEdit: (link: LinkDTO) => void;
  onQr: (link: LinkDTO) => void;
  onToggleDisabled: (link: LinkDTO) => void;
  onDelete: (link: LinkDTO) => void;
  onCreate: () => void;
}

const actionButton =
  "rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white";

export function LinksTable({
  links,
  onCopy,
  onEdit,
  onQr,
  onToggleDisabled,
  onDelete,
  onCreate,
}: LinksTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4 text-violet-300">
          <LinkIcon width={28} height={28} />
        </div>
        <h2 className="mt-5 text-lg font-semibold text-white">No links yet</h2>
        <p className="mt-2 max-w-sm text-sm text-slate-400">
          Shorten your first URL and it will show up here with live click
          analytics and a downloadable QR code.
        </p>
        <button
          type="button"
          onClick={onCreate}
          className="mt-6 rounded-lg bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400"
        >
          Create your first link
        </button>
      </div>
    );
  }

  async function copy(link: LinkDTO) {
    try {
      await navigator.clipboard.writeText(link.shortUrl);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 1500);
      onCopy();
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-slate-500">
            <th className="px-5 py-3.5 font-medium">Short link</th>
            <th className="px-5 py-3.5 font-medium">Destination</th>
            <th className="px-5 py-3.5 font-medium">Clicks</th>
            <th className="px-5 py-3.5 font-medium">Status</th>
            <th className="hidden px-5 py-3.5 font-medium lg:table-cell">Created</th>
            <th className="px-5 py-3.5 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {links.map((link) => {
            const status = statusStyles[linkStatus(link)];
            return (
              <tr
                key={link.id}
                className="border-b border-white/5 transition last:border-0 hover:bg-white/[0.02]"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/links/${link.id}`}
                      className="font-semibold text-violet-300 hover:text-violet-200"
                    >
                      /{link.slug}
                    </Link>
                    <button
                      type="button"
                      onClick={() => copy(link)}
                      className={actionButton}
                      title="Copy short link"
                      aria-label={`Copy short link /${link.slug}`}
                    >
                      {copiedId === link.id ? (
                        <CheckIcon width={14} height={14} className="text-emerald-400" />
                      ) : (
                        <CopyIcon width={14} height={14} />
                      )}
                    </button>
                  </div>
                </td>
                <td className="max-w-[260px] px-5 py-4">
                  <a
                    href={link.destination}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white"
                    title={link.destination}
                  >
                    <span className="truncate">
                      {truncateMiddle(link.destination.replace(/^https?:\/\//, ""), 40)}
                    </span>
                    <ExternalIcon width={12} height={12} className="shrink-0 text-slate-500" />
                  </a>
                </td>
                <td className="px-5 py-4 font-semibold text-white">
                  {formatNumber(link.clickCount)}
                  {link.maxClicks !== null ? (
                    <span className="ml-1 text-xs font-normal text-slate-500">
                      / {formatNumber(link.maxClicks)}
                    </span>
                  ) : null}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.className}`}
                  >
                    {status.label}
                  </span>
                </td>
                <td className="hidden px-5 py-4 text-slate-400 lg:table-cell">
                  {formatDate(link.createdAt)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-0.5">
                    <Link
                      href={`/links/${link.id}`}
                      className={actionButton}
                      title="Analytics"
                      aria-label={`Analytics for /${link.slug}`}
                    >
                      <ChartIcon width={15} height={15} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => onQr(link)}
                      className={actionButton}
                      title="QR code"
                      aria-label={`QR code for /${link.slug}`}
                    >
                      <QrIcon width={15} height={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(link)}
                      className={actionButton}
                      title="Edit"
                      aria-label={`Edit /${link.slug}`}
                    >
                      <PencilIcon width={15} height={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleDisabled(link)}
                      className={`${actionButton} ${link.disabled ? "text-amber-400" : ""}`}
                      title={link.disabled ? "Enable" : "Disable"}
                      aria-label={`${link.disabled ? "Enable" : "Disable"} /${link.slug}`}
                    >
                      <PowerIcon width={15} height={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(link)}
                      className={`${actionButton} hover:text-rose-400`}
                      title="Delete"
                      aria-label={`Delete /${link.slug}`}
                    >
                      <TrashIcon width={15} height={15} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
