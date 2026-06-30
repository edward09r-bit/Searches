"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";

const ChangeStatusSchema = z.object({
  toStatus: z.enum(["NEW", "REVIEWING", "WATCHLIST", "PASSED", "CLOSED", "STALE"]),
  reason: z.string().optional(),
});

// Every transition is recorded in StatusHistoryEntry for an audit trail.
// Watchlist membership is tracked separately via WatchlistEntry (see
// toggleWatchlist) rather than inferred from currentStatus === "WATCHLIST" —
// a listing can be watchlisted independent of its formal status.
export async function changeStatus(listingId: string, formData: FormData) {
  const parsed = ChangeStatusSchema.parse(Object.fromEntries(formData.entries()));
  const listing = await prisma.listing.findUniqueOrThrow({ where: { id: listingId } });

  if (listing.currentStatus !== parsed.toStatus) {
    const reason = parsed.reason?.trim() || null;

    await prisma.$transaction([
      prisma.listing.update({ where: { id: listingId }, data: { currentStatus: parsed.toStatus } }),
      prisma.statusHistoryEntry.create({
        data: { listingId, fromStatus: listing.currentStatus, toStatus: parsed.toStatus, reason },
      }),
    ]);
  }

  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/listings");
  revalidatePath("/dashboard");
}

export async function toggleWatchlist(listingId: string) {
  const existing = await prisma.watchlistEntry.findUnique({ where: { listingId } });

  if (existing) {
    await prisma.watchlistEntry.delete({ where: { listingId } });
  } else {
    await prisma.watchlistEntry.create({ data: { listingId } });
  }

  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/listings");
  revalidatePath("/dashboard");
  revalidatePath("/watchlist");
}
