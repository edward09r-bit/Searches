import { toggleWatchlist } from "@/lib/actions/status-actions";

export function WatchlistToggle({ listingId, isWatchlisted }: { listingId: string; isWatchlisted: boolean }) {
  const boundToggle = toggleWatchlist.bind(null, listingId);

  return (
    <form action={boundToggle}>
      <button
        type="submit"
        className={
          isWatchlisted
            ? "rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
            : "rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700"
        }
      >
        {isWatchlisted ? "★ On watchlist" : "☆ Add to watchlist"}
      </button>
    </form>
  );
}
