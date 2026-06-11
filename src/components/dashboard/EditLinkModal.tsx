"use client";

import { useEffect, useState, type FormEvent } from "react";
import { SpinnerIcon } from "@/components/icons";
import { Modal } from "@/components/ui/Modal";
import {
  FieldHint,
  FormError,
  Input,
  Label,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui/fields";
import type { LinkDTO } from "@/lib/links";

interface ApiError {
  error?: { message?: string };
}

interface EditLinkModalProps {
  link: LinkDTO | null;
  onClose: () => void;
  onSaved: (link: LinkDTO) => void;
}

/** ISO timestamp -> value usable by <input type="datetime-local">. */
function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function EditLinkModal({ link, onClose, onSaved }: EditLinkModalProps) {
  const [destination, setDestination] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxClicks, setMaxClicks] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (link) {
      setDestination(link.destination);
      setExpiresAt(link.expiresAt ? toLocalInputValue(link.expiresAt) : "");
      setMaxClicks(link.maxClicks !== null ? String(link.maxClicks) : "");
      setError(null);
    }
  }, [link]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!link || loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/links/${link.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          destination,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
          maxClicks: maxClicks ? Number(maxClicks) : null,
        }),
      });
      const body = (await res.json()) as ApiError & { link?: LinkDTO };
      if (!res.ok || !body.link) {
        setError(body.error?.message ?? "Could not save changes.");
        return;
      }
      onSaved(body.link);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={link !== null} onClose={onClose} title={`Edit /${link?.slug ?? ""}`}>
      <form onSubmit={submit} className="space-y-4">
        <FormError message={error} />
        <div>
          <Label htmlFor="edit-destination">Destination URL</Label>
          <Input
            id="edit-destination"
            type="url"
            required
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
          <FieldHint>
            The slug itself is permanent — QR codes in the wild keep working.
          </FieldHint>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="edit-expires">Expires at</Label>
            <Input
              id="edit-expires"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <FieldHint>Clear the field to remove the expiry.</FieldHint>
          </div>
          <div>
            <Label htmlFor="edit-max">Max clicks</Label>
            <Input
              id="edit-max"
              type="number"
              min={1}
              max={1_000_000}
              value={maxClicks}
              onChange={(e) => setMaxClicks(e.target.value)}
              placeholder="No limit"
            />
            <FieldHint>Clear the field to remove the cap.</FieldHint>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={secondaryButtonClass}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className={primaryButtonClass}>
            {loading ? <SpinnerIcon width={15} height={15} /> : null}
            Save changes
          </button>
        </div>
      </form>
    </Modal>
  );
}
