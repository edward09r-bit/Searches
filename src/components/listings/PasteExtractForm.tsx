"use client";

import { useState } from "react";
import type { ExtractedListing } from "@/lib/extraction";

const textareaClass =
  "mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none";

export function PasteExtractForm({ onExtracted }: { onExtracted: (data: ExtractedListing, rawText: string) => void }) {
  const [rawText, setRawText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExtract() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Extraction failed.");
        return;
      }
      onExtracted(json.extracted, rawText);
    } catch {
      setError("Extraction failed — check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700" htmlFor="pasteText">
          Paste the listing text
        </label>
        <textarea
          id="pasteText"
          rows={14}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          className={textareaClass}
          placeholder="Paste the full business-for-sale listing description here..."
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleExtract}
        disabled={pending || rawText.trim().length === 0}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Extracting…" : "Extract listing details"}
      </button>

      <p className="text-xs text-zinc-400">
        Extraction only pulls values literally stated in the text — nothing is estimated. You&apos;ll review every field
        before saving.
      </p>
    </div>
  );
}
