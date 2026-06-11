"use client";

import { useState } from "react";
import { PlusIcon } from "@/components/icons";
import { primaryButtonClass } from "@/components/ui/fields";
import type { LinkDTO } from "@/lib/links";
import { CreateLinkModal } from "./CreateLinkModal";
import { DeleteLinkModal } from "./DeleteLinkModal";
import { EditLinkModal } from "./EditLinkModal";
import { LinksTable } from "./LinksTable";
import { QrModal } from "./QrModal";

interface ApiError {
  error?: { message?: string };
}

export function DashboardClient({ initialLinks }: { initialLinks: LinkDTO[] }) {
  const [links, setLinks] = useState<LinkDTO[]>(initialLinks);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<LinkDTO | null>(null);
  const [qrFor, setQrFor] = useState<LinkDTO | null>(null);
  const [deleting, setDeleting] = useState<LinkDTO | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function flash(message: string) {
    setNotice(message);
    setTimeout(() => setNotice(null), 2500);
  }

  async function toggleDisabled(link: LinkDTO) {
    const res = await fetch(`/api/links/${link.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ disabled: !link.disabled }),
    });
    if (res.ok) {
      const body = (await res.json()) as { link: LinkDTO };
      setLinks((prev) => prev.map((l) => (l.id === link.id ? body.link : l)));
      flash(body.link.disabled ? "Link disabled." : "Link re-enabled.");
    } else {
      const body = (await res.json()) as ApiError;
      flash(body.error?.message ?? "Update failed.");
    }
  }

  async function confirmDelete(link: LinkDTO) {
    const res = await fetch(`/api/links/${link.id}`, { method: "DELETE" });
    if (res.ok) {
      setLinks((prev) => prev.filter((l) => l.id !== link.id));
      flash("Link deleted.");
    } else {
      const body = (await res.json()) as ApiError;
      flash(body.error?.message ?? "Delete failed.");
    }
    setDeleting(null);
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Your links</h1>
          <p className="mt-1 text-sm text-slate-400">
            {links.length === 0
              ? "Nothing here yet — create your first short link."
              : `${links.length} link${links.length === 1 ? "" : "s"} · ${links.reduce((sum, l) => sum + l.clickCount, 0)} total clicks`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className={primaryButtonClass}
        >
          <PlusIcon width={15} height={15} />
          New link
        </button>
      </div>

      {notice ? (
        <div className="mt-4 animate-fade-in rounded-lg border border-violet-500/20 bg-violet-500/10 px-4 py-2.5 text-sm text-violet-200">
          {notice}
        </div>
      ) : null}

      <div className="mt-6">
        <LinksTable
          links={links}
          onCopy={() => flash("Short link copied to clipboard.")}
          onEdit={setEditing}
          onQr={setQrFor}
          onToggleDisabled={toggleDisabled}
          onDelete={setDeleting}
          onCreate={() => setCreateOpen(true)}
        />
      </div>

      <CreateLinkModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(link) => {
          setLinks((prev) => [link, ...prev]);
          setCreateOpen(false);
          flash("Short link created.");
        }}
      />
      <EditLinkModal
        link={editing}
        onClose={() => setEditing(null)}
        onSaved={(link) => {
          setLinks((prev) => prev.map((l) => (l.id === link.id ? link : l)));
          setEditing(null);
          flash("Link updated.");
        }}
      />
      <QrModal link={qrFor} onClose={() => setQrFor(null)} />
      <DeleteLinkModal
        link={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
