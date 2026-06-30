import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export const ListingFilterSchema = z.object({
  state: z.string().trim().min(1).optional(),
  industry: z.string().trim().min(1).optional(),
  status: z.enum(["NEW", "REVIEWING", "WATCHLIST", "PASSED", "CLOSED", "STALE"]).optional(),
  franchise: z.enum(["franchise", "independent"]).optional(),
  semiAbsentee: z.enum(["true", "false"]).optional(),
  minScore: z.coerce.number().optional(),
  maxScore: z.coerce.number().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minTakeHome: z.coerce.number().optional(),
  maxTakeHome: z.coerce.number().optional(),
  minDscr: z.coerce.number().optional(),
});

export type ListingFilters = z.infer<typeof ListingFilterSchema>;

// Bad/missing query params degrade to "no filter" rather than a 500 — this
// is a GET form, so malformed input is expected (stale bookmarks, manual edits).
export function parseListingFilters(searchParams: Record<string, string | string[] | undefined>): ListingFilters {
  const flat: Record<string, string | undefined> = {};
  for (const key of Object.keys(searchParams)) {
    const value = searchParams[key];
    flat[key] = Array.isArray(value) ? value[0] : value;
  }
  const parsed = ListingFilterSchema.safeParse(flat);
  return parsed.success ? parsed.data : {};
}

// Shared shape for every listing summary card (dashboard sections + the
// filtered listings page) — one evaluation/score/memo deep, never more.
export const LISTING_CARD_SELECT = {
  id: true,
  businessName: true,
  locationCity: true,
  locationState: true,
  askingPrice: true,
  annualRevenue: true,
  annualSde: true,
  industry: true,
  currentStatus: true,
  isFranchise: true,
  hasGmOrLeadOperator: true,
  evaluations: {
    where: { isCurrent: true },
    take: 1,
    select: {
      dscr: true,
      conservativeMonthlyTakeHome: true,
      scoreResult: { select: { finalScore: true, label: true } },
      memo: { select: { businessOverview: true } },
    },
  },
} satisfies Prisma.ListingSelect;

export type ListingCardData = Prisma.ListingGetPayload<{ select: typeof LISTING_CARD_SELECT }>;

export async function queryListings(filters: ListingFilters): Promise<ListingCardData[]> {
  const where: Prisma.ListingWhereInput = {};

  if (filters.state) where.locationState = filters.state.toUpperCase();
  if (filters.industry) where.industry = { contains: filters.industry, mode: "insensitive" };
  if (filters.status) where.currentStatus = filters.status;
  if (filters.franchise) where.isFranchise = filters.franchise === "franchise";
  if (filters.semiAbsentee) where.hasGmOrLeadOperator = filters.semiAbsentee === "true";

  if (filters.minPrice != null || filters.maxPrice != null) {
    where.askingPrice = {
      ...(filters.minPrice != null ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice != null ? { lte: filters.maxPrice } : {}),
    };
  }

  const evaluationConditions: Prisma.EvaluationWhereInput = { isCurrent: true };
  let hasEvaluationFilter = false;

  if (filters.minTakeHome != null || filters.maxTakeHome != null) {
    evaluationConditions.conservativeMonthlyTakeHome = {
      ...(filters.minTakeHome != null ? { gte: filters.minTakeHome } : {}),
      ...(filters.maxTakeHome != null ? { lte: filters.maxTakeHome } : {}),
    };
    hasEvaluationFilter = true;
  }

  if (filters.minDscr != null) {
    evaluationConditions.dscr = { gte: filters.minDscr };
    hasEvaluationFilter = true;
  }

  if (filters.minScore != null || filters.maxScore != null) {
    evaluationConditions.scoreResult = {
      finalScore: {
        ...(filters.minScore != null ? { gte: filters.minScore } : {}),
        ...(filters.maxScore != null ? { lte: filters.maxScore } : {}),
      },
    };
    hasEvaluationFilter = true;
  }

  if (hasEvaluationFilter) {
    where.evaluations = { some: evaluationConditions };
  }

  return prisma.listing.findMany({
    where,
    orderBy: { dateFirstSeen: "desc" },
    select: LISTING_CARD_SELECT,
  });
}
