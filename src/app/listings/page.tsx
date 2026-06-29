import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ListingsPage() {
  const listings = await prisma.listing.findMany({
    orderBy: { dateFirstSeen: "desc" },
    select: {
      id: true,
      businessName: true,
      locationCity: true,
      locationState: true,
      askingPrice: true,
      industry: true,
      currentStatus: true,
      dateFirstSeen: true,
    },
  });

  return (
    <div className="px-6 py-10">
      <div className="mx-auto flex max-w-3xl items-center justify-between">
        <h1 className="text-2xl font-bold">Listings</h1>
        <Link href="/listings/new" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
          New listing
        </Link>
      </div>

      <div className="mx-auto mt-8 max-w-3xl divide-y divide-zinc-200 rounded-md border border-zinc-200">
        {listings.length === 0 && <p className="p-6 text-sm text-zinc-500">No listings yet.</p>}
        {listings.map((listing) => (
          <Link
            key={listing.id}
            href={`/listings/${listing.id}`}
            className="flex items-center justify-between p-4 hover:bg-zinc-50"
          >
            <div>
              <p className="font-medium">{listing.businessName}</p>
              <p className="text-sm text-zinc-500">
                {[listing.locationCity, listing.locationState].filter(Boolean).join(", ") || "Location unknown"}
                {listing.industry ? ` · ${listing.industry}` : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">
                {listing.askingPrice != null ? `$${listing.askingPrice.toLocaleString()}` : "Price unknown"}
              </p>
              <p className="text-xs uppercase text-zinc-500">{listing.currentStatus}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
