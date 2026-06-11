"use client";

import { useState } from "react";
import { SpinnerIcon } from "@/components/icons";
import { Modal } from "@/components/ui/Modal";
import { dangerButtonClass, secondaryButtonClass } from "@/components/ui/fields";
import type { LinkDTO } from "@/lib/links";

interface DeleteLinkModalProps {
  link: LinkDTO | null;
  onClose: () => void;
  onConfirm: (link: LinkDTO) => Promise<void>;
}

export function DeleteLinkModal({ link, onClose, onConfirm }: DeleteLinkModalProps) {
  const [busy, setBusy] = useState(false);

  return (
    <Modal
      open={link !== null}
      onClose={onClose}
      title="Delete this link?"
      widthClass="max-w-md"
    >
      <p className="text-sm leading-relaxed text-slate-400">
        <span className="font-semibold text-white">/{link?.slug}</span> and all{" "}
        {link?.clickCount ?? 0} recorded click
        {(link?.clickCount ?? 0) === 1 ? "" : "s"} will be permanently removed.
        Anyone visiting the short link will see a 404. This cannot be undone.
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onClose} className={secondaryButtonClass}>
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            if (!link) return;
            setBusy(true);
            try {
              await onConfirm(link);
            } finally {
              setBusy(false);
            }
          }}
          className={dangerButtonClass}
        >
          {busy ? <SpinnerIcon width={15} height={15} /> : null}
          Delete link
        </button>
      </div>
    </Modal>
  );
}
