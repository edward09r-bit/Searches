import { getWatchlistListings } from "@/lib/queries/listings";
import { ListingCard } from "@/components/listings/ListingCard";

export default async function WatchlistPage() {
  const listings = await getWatchlistListings();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-bold">Watchlist</h1>
      <p className="mt-1 text-sm text-zinc-500">Ordered by priority, then most recently added.</p>

      <div className="mt-6 space-y-4">
        {listings.length === 0 ? (
          <p className="text-sm text-zinc-400">Nothing on the watchlist yet.</p>
        ) : (
          listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)
        )}
      </div>
    </div>
  );
}
