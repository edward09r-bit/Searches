import { getDashboardData } from "@/lib/queries/dashboard";
import { ListingCard } from "@/components/listings/ListingCard";
import type { ListingCardData } from "@/lib/filters";

function DashboardSection({
  title,
  listings,
  emptyText,
}: {
  title: string;
  listings: ListingCardData[];
  emptyText: string;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold">{title}</h2>
      {listings.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-400">{emptyText}</p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function DashboardPage() {
  const { newToday, topScored, watchlist, passed, recentUpdates } = await getDashboardData();

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-6 py-10">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <DashboardSection title="New today" listings={newToday} emptyText="No new listings added today." />
      <DashboardSection title="Top scored" listings={topScored} emptyText="No evaluated listings yet." />
      <DashboardSection title="Watchlist" listings={watchlist} emptyText="Nothing on the watchlist yet." />
      <DashboardSection title="Recently updated" listings={recentUpdates} emptyText="No listings yet." />
      <DashboardSection title="Passed" listings={passed} emptyText="No passed listings." />
    </div>
  );
}
