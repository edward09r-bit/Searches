import { prisma } from "./prisma";
import { diceCoefficient } from "./string-similarity";

const FUZZY_MATCH_THRESHOLD = 0.85;

export type DuplicateMatch = {
  listingId: string;
  businessName: string;
  source: string;
  currentStatus: string;
  matchTier: "exact" | "fuzzy";
  similarity?: number;
};

export type DedupeCandidateInput = {
  source?: string | null;
  sourceListingId?: string | null;
  businessName: string;
  locationState?: string | null;
};

// Tier 1: exact match on (source, sourceListingId) — the same listing
// re-pasted from the same marketplace. Tier 2: fuzzy name match within the
// same state. Either tier is surfaced to the user as a banner; neither is
// ever used to silently merge or overwrite an existing Listing row.
export async function findPotentialDuplicate(input: DedupeCandidateInput): Promise<DuplicateMatch | null> {
  if (input.source && input.sourceListingId) {
    const exact = await prisma.listing.findFirst({
      where: { source: input.source, sourceListingId: input.sourceListingId },
      select: { id: true, businessName: true, source: true, currentStatus: true },
    });

    if (exact) {
      return {
        listingId: exact.id,
        businessName: exact.businessName,
        source: exact.source,
        currentStatus: exact.currentStatus,
        matchTier: "exact",
      };
    }
  }

  if (!input.locationState) return null;

  const candidates = await prisma.listing.findMany({
    where: { locationState: input.locationState },
    select: { id: true, businessName: true, source: true, currentStatus: true },
  });

  let best: { listingId: string; businessName: string; source: string; currentStatus: string; similarity: number } | null = null;

  for (const candidate of candidates) {
    const similarity = diceCoefficient(input.businessName, candidate.businessName);
    if (similarity >= FUZZY_MATCH_THRESHOLD && (!best || similarity > best.similarity)) {
      best = { listingId: candidate.id, businessName: candidate.businessName, source: candidate.source, currentStatus: candidate.currentStatus, similarity };
    }
  }

  if (!best) return null;

  return {
    listingId: best.listingId,
    businessName: best.businessName,
    source: best.source,
    currentStatus: best.currentStatus,
    matchTier: "fuzzy",
    similarity: best.similarity,
  };
}
