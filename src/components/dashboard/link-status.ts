import type { LinkDTO } from "@/lib/links";

export type LinkStatus = "active" | "disabled" | "expired";

/** Client-side mirror of the server's lazy expiry rules, for badges. */
export function linkStatus(link: LinkDTO, now: Date = new Date()): LinkStatus {
  if (link.disabled) return "disabled";
  if (link.expiresAt && now.getTime() >= new Date(link.expiresAt).getTime()) {
    return "expired";
  }
  if (link.maxClicks !== null && link.clickCount >= link.maxClicks) {
    return "expired";
  }
  return "active";
}

export const statusStyles: Record<LinkStatus, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  },
  disabled: {
    label: "Disabled",
    className: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  },
  expired: {
    label: "Expired",
    className: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  },
};
