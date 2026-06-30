import Link from "next/link";
import type { ListingCardData } from "@/lib/filters";
import { ScoreBadge } from "./ScoreBadge";

const fmtMoney = (v: number | null | undefined) => (v != null ? `$${Math.round(v).toLocaleString()}` : "—");

// Cards render without an LLM call: the summary is the memo's first sentence
// when a memo exists, otherwise a deterministic fallback built from already
// -extracted fields.
function buildCardSummary(listing: ListingCardData): string {
  const overview = listing.evaluations[0]?.memo?.businessOverview;
  if (overview) {
    const firstSentence = overview.split(/(?<=[.!?])\s/)[0];
    if (firstSentence) return firstSentence;
  }

  const location = [listing.locationCity, listing.locationState].filter(Boolean).join(", ") || "an undisclosed location";
  const industry = listing.industry ?? "an unspecified industry";
  return `${listing.businessName} — ${industry} in ${location}.`;
}

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const evaluation = listing.evaluations[0];
  const score = evaluation?.scoreResult;

  return (
    <Link href={`/listings/${listing.id}`} className="block rounded-md border border-zinc-200 p-4 hover:bg-zinc-50">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium">{listing.businessName}</p>
          <p className="text-sm text-zinc-500">
            {[listing.locationCity, listing.locationState].filter(Boolean).join(", ") || "Location unknown"}
            {listing.industry ? ` · ${listing.industry}` : ""}
          </p>
        </div>
        {score && <ScoreBadge score={score.finalScore} />}
      </div>

      <p className="mt-2 text-sm text-zinc-700">{buildCardSummary(listing)}</p>

      <dl className="mt-3 grid grid-cols-2 gap-1 text-xs text-zinc-500 sm:grid-cols-4">
        <div>
          <dt className="inline">Asking: </dt>
          <dd className="inline font-medium text-zinc-700">{fmtMoney(listing.askingPrice)}</dd>
        </div>
        <div>
          <dt className="inline">Revenue: </dt>
          <dd className="inline font-medium text-zinc-700">{fmtMoney(listing.annualRevenue)}</dd>
        </div>
        <div>
          <dt className="inline">SDE: </dt>
          <dd className="inline font-medium text-zinc-700">{fmtMoney(listing.annualSde)}</dd>
        </div>
        {evaluation && (
          <div>
            <dt className="inline">DSCR: </dt>
            <dd className="inline font-medium text-zinc-700">{evaluation.dscr.toFixed(2)}x</dd>
          </div>
        )}
        {evaluation && (
          <div className="col-span-2 sm:col-span-4">
            <dt className="inline">Conservative take-home: </dt>
            <dd className="inline font-medium text-zinc-700">{fmtMoney(evaluation.conservativeMonthlyTakeHome)}/mo</dd>
          </div>
        )}
      </dl>
    </Link>
  );
}
