import { ListingIntake } from "@/components/listings/ListingIntake";

export default function NewListingPage() {
  return (
    <div className="px-6 py-10">
      <h1 className="mx-auto max-w-3xl text-2xl font-bold">New listing</h1>
      <p className="mx-auto mb-8 max-w-3xl text-sm text-zinc-500">
        Paste a listing description to auto-extract fields, or enter them manually. Fields left
        blank are stored as unknown rather than guessed — the scoring engine treats unknowns
        conservatively.
      </p>
      <ListingIntake />
    </div>
  );
}
