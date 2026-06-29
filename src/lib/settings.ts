import { prisma } from "./prisma";
import type { Settings as PrismaSettings } from "@prisma/client";

export type Settings = Omit<PrismaSettings, "preferredIndustries"> & {
  preferredIndustries: string[];
};

// Seed data guarantees the singleton row exists, so a miss here means the
// DB was never seeded — surfacing that loudly beats silently falling back
// to in-code defaults that could drift from prisma/seed.ts.
export async function getSettings(): Promise<Settings> {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    throw new Error("Settings singleton row is missing — run `prisma db seed` before using the app.");
  }
  return { ...settings, preferredIndustries: settings.preferredIndustries as string[] };
}

export function settingsToScoringWeights(settings: Settings) {
  return {
    dscr: settings.weightDscr,
    takeHome: settings.weightTakeHome,
    semiAbsentee: settings.weightSemiAbsentee,
    staffDepth: settings.weightStaffDepth,
    leaseStability: settings.weightLeaseStability,
    industryQuality: settings.weightIndustryQuality,
    valuationMultiple: settings.weightValuationMultiple,
    redFlags: settings.weightRedFlags,
  };
}
