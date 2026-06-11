"use client";

import { useState, type FormEvent } from "react";
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

interface CreateLinkModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (link: LinkDTO) => void;
}

export function CreateLinkModal({ open, onClose, onCreated }: CreateLinkModalProps) {
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxClicks, setMaxClicks] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function reset() {
    setUrl("");
    setSlug("");
    setExpiresAt("");
    setMaxClicks("");
    setError(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url,
          ...(slug.trim() ? { slug: slug.trim() } : {}),
          ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
          ...(maxClicks ? { maxClicks: Number(maxClicks) } : {}),
        }),
      });
      const body = (await res.json()) as ApiError & { link?: LinkDTO };
      if (!res.ok || !body.link) {
        setError(body.error?.message ?? "Could not create the link.");
        return;
      }
      reset();
      onCreated(body.link);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create a short link">
      <form onSubmit={submit} className="space-y-4">
        <FormError message={error} />
        <div>
          <Label htmlFor="create-url">Destination URL</Label>
          <Input
            id="create-url"
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/a/very/long/path"
          />
        </div>
        <div>
          <Label htmlFor="create-slug">Custom slug (optional)</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">/</span>
            <Input
              id="create-slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-launch"
              maxLength={32}
              pattern="[A-Za-z0-9_-]{3,32}"
              title="3-32 characters: letters, numbers, hyphens, underscores"
            />
          </div>
          <FieldHint>
            3–32 characters. Letters, numbers, hyphens, underscores. Leave empty
            for a random slug.
          </FieldHint>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="create-expires">Expires at (optional)</Label>
            <Input
              id="create-expires"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="create-max">Max clicks (optional)</Label>
            <Input
              id="create-max"
              type="number"
              min={1}
              max={1_000_000}
              value={maxClicks}
              onChange={(e) => setMaxClicks(e.target.value)}
              placeholder="e.g. 500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={secondaryButtonClass}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className={primaryButtonClass}>
            {loading ? <SpinnerIcon width={15} height={15} /> : null}
            Create link
          </button>
        </div>
      </form>
    </Modal>
  );
}
