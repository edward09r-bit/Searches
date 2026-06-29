import { prisma } from "../prisma";
import { LISTING_CARD_SELECT, type ListingCardData } from "../filters";
import { getWatchlistListings } from "./listings";

async function getNewToday(): Promise<ListingCardData[]> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return prisma.listing.findMany({
    where: { dateFirstSeen: { gte: startOfToday } },
    orderBy: { dateFirstSeen: "desc" },
    select: LISTING_CARD_SELECT,
  });
}

// Ordering by a nested relation's scalar (Listing -> Evaluation -> ScoreResult)
// isn't expressible in a single findMany, so the ranking query runs against
// ScoreResult directly, then the matching listings are re-fetched and put
// back in score order.
async function getTopScored(): Promise<ListingCardData[]> {
  const ranked = await prisma.scoreResult.findMany({
    where: { evaluation: { isCurrent: true }, hardRejectTriggered: false },
    orderBy: { finalScore: "desc" },
    take: 10,
    select: { evaluation: { select: { listingId: true } } },
  });

  return reorderListings(ranked.map((r) => r.evaluation.listingId));
}

async function getPassed(): Promise<ListingCardData[]> {
  return prisma.listing.findMany({
    where: { currentStatus: "PASSED" },
    orderBy: { dateLastUpdated: "desc" },
    take: 10,
    select: LISTING_CARD_SELECT,
  });
}

async function getRecentUpdates(): Promise<ListingCardData[]> {
  return prisma.listing.findMany({
    orderBy: { dateLastUpdated: "desc" },
    take: 10,
    select: LISTING_CARD_SELECT,
  });
}

async function reorderListings(orderedIds: string[]): Promise<ListingCardData[]> {
  if (orderedIds.length === 0) return [];
  const listings = await prisma.listing.findMany({
    where: { id: { in: orderedIds } },
    select: LISTING_CARD_SELECT,
  });
  const byId = new Map(listings.map((l) => [l.id, l]));
  return orderedIds.map((id) => byId.get(id)).filter((l): l is ListingCardData => l != null);
}

export async function getDashboardData() {
  const [newToday, topScored, watchlist, passed, recentUpdates] = await Promise.all([
    getNewToday(),
    getTopScored(),
    getWatchlistListings(),
    getPassed(),
    getRecentUpdates(),
  ]);

  return { newToday, topScored, watchlist, passed, recentUpdates };
}
