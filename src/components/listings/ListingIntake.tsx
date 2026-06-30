"use client";

import { useState } from "react";
import { ListingForm } from "./ListingForm";
import { PasteExtractForm } from "./PasteExtractForm";
import type { ExtractedListing } from "@/lib/extraction";
import type { DuplicateMatch } from "@/lib/dedupe";

type Tab = "paste" | "manual";

const tabButtonClass = (active: boolean) =>
  `px-4 py-2 text-sm font-medium ${active ? "border-b-2 border-zinc-900 text-zinc-900" : "text-zinc-500"}`;

export function ListingIntake() {
  const [tab, setTab] = useState<Tab>("paste");
  const [extracted, setExtracted] = useState<ExtractedListing | undefined>(undefined);
  const [rawPastedText, setRawPastedText] = useState<string | undefined>(undefined);
  const [potentialDuplicate, setPotentialDuplicate] = useState<DuplicateMatch | null>(null);
  // Bumped whenever new extraction results arrive so ListingForm remounts
  // and its defaultValue-driven inputs pick up the new values.
  const [formKey, setFormKey] = useState(0);

  function handleExtracted(data: ExtractedListing, rawText: string, duplicate: DuplicateMatch | null) {
    setExtracted(data);
    setRawPastedText(rawText);
    setPotentialDuplicate(duplicate);
    setFormKey((k) => k + 1);
    setTab("manual");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex gap-2 border-b border-zinc-200">
        <button type="button" onClick={() => setTab("paste")} className={tabButtonClass(tab === "paste")}>
          Paste & extract
        </button>
        <button type="button" onClick={() => setTab("manual")} className={tabButtonClass(tab === "manual")}>
          {extracted ? "Review extracted fields" : "Enter manually"}
        </button>
      </div>

      {tab === "paste" && <PasteExtractForm onExtracted={handleExtracted} />}

      {tab === "manual" && (
        <>
          {extracted && (
            <p className="mb-4 rounded-md bg-zinc-50 px-4 py-2 text-sm text-zinc-600">
              Extraction confidence: <span className="font-medium">{extracted.extractionConfidence}</span>. Nothing was
              estimated — review every field below before saving.
            </p>
          )}
          <ListingForm key={formKey} initialValues={extracted} rawPastedText={rawPastedText} potentialDuplicate={potentialDuplicate} />
        </>
      )}
    </div>
  );
}
