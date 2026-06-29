import { prisma } from "../prisma";
import { LISTING_CARD_SELECT, type ListingCardData } from "../filters";

export async function getWatchlistListings(): Promise<ListingCardData[]> {
  const entries = await prisma.watchlistEntry.findMany({
    orderBy: [{ priority: "desc" }, { addedAt: "desc" }],
    select: { listingId: true },
  });

  if (entries.length === 0) return [];

  const ids = entries.map((e) => e.listingId);
  const listings = await prisma.listing.findMany({
    where: { id: { in: ids } },
    select: LISTING_CARD_SELECT,
  });

  const byId = new Map(listings.map((l) => [l.id, l]));
  return ids.map((id) => byId.get(id)).filter((l): l is ListingCardData => l != null);
}
