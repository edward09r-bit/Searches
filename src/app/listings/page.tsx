import Link from "next/link";
import { ListingFilterBar } from "@/components/filters/ListingFilterBar";
import { ListingCard } from "@/components/listings/ListingCard";
import { parseListingFilters, queryListings } from "@/lib/filters";

// Next.js 16: `searchParams` is a Promise with no synchronous-access fallback.
export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const filters = parseListingFilters(resolvedSearchParams);
  const listings = await queryListings(filters);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Listings</h1>
        <Link href="/listings/new" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
          New listing
        </Link>
      </div>

      <div className="mt-6">
        <ListingFilterBar filters={filters} />
      </div>

      {listings.length === 0 ? (
        <p className="text-sm text-zinc-500">No listings match these filters.</p>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
