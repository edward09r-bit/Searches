import { z } from "zod";
import type { Evaluation, Listing, ScoreResult } from "@prisma/client";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic } from "./claude";
import type { FallbackNarrative } from "./memo";

const NARRATIVE_MODEL = "claude-sonnet-4-6";

export const MemoNarrativeSchema = z.object({
  businessOverview: z.string(),
  fitNarrative: z.string(),
  redFlagsNarrative: z.string(),
});

export type MemoNarrative = z.infer<typeof MemoNarrativeSchema>;

const NARRATIVE_SYSTEM_PROMPT = `You write the qualitative narrative section of a buy-side acquisition memo. You are given a JSON object containing every number and fact already computed by a deterministic financial model and scoring engine — this is the buyer's only source of truth.

Rules, strictly enforced:
1. Use only facts and numbers present in the grounding JSON. Never invent, estimate, or infer a number that isn't there.
2. If a field in the grounding JSON is null or missing, say it's unstated/unknown rather than guessing.
3. Write exactly three fields:
   - businessOverview: 2-4 sentences describing the business (industry, location, years in business, reason for sale).
   - fitNarrative: 2-4 sentences on semi-absentee fit, referencing the GM/lead-operator status, owner hours/week, and semi-absentee score from the JSON.
   - redFlagsNarrative: 1-3 sentences discussing the red flags list from the JSON. If the list is empty, say no red flags were identified by the automated screen.
4. Be direct and factual, not promotional — this is a screening tool for the buyer's own diligence, not marketing copy.`;

export async function generateMemoNarrative(
  listing: Listing,
  evaluation: Evaluation,
  scoreResult: ScoreResult,
): Promise<MemoNarrative> {
  const groundingContext = {
    businessName: listing.businessName,
    industry: listing.industry,
    subIndustry: listing.subIndustry,
    locationCity: listing.locationCity,
    locationState: listing.locationState,
    yearsInBusiness: listing.yearsInBusiness,
    reasonForSale: listing.reasonForSale,
    hasGmOrLeadOperator: listing.hasGmOrLeadOperator,
    ownerHoursPerWeek: listing.ownerHoursPerWeek,
    employeeCount: listing.employeeCount,
    semiAbsenteeScore: scoreResult.semiAbsenteeScore,
    finalScore: scoreResult.finalScore,
    label: scoreResult.label,
    dscr: evaluation.dscr,
    conservativeMonthlyTakeHome: evaluation.conservativeMonthlyTakeHome,
    redFlags: scoreResult.redFlags,
    hardRejectTriggered: scoreResult.hardRejectTriggered,
    hardRejectReasons: scoreResult.hardRejectReasons,
  };

  const response = await anthropic.messages.parse({
    model: NARRATIVE_MODEL,
    max_tokens: 1024,
    system: NARRATIVE_SYSTEM_PROMPT,
    messages: [{ role: "user", content: JSON.stringify(groundingContext) }],
    output_config: {
      format: zodOutputFormat(MemoNarrativeSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("Claude returned a response that didn't match the expected narrative schema.");
  }

  return response.parsed_output;
}

// Used by callers that want a narrative with a guaranteed deterministic
// fallback — memo generation should never hard-fail on the narrative step.
export async function generateMemoNarrativeWithFallback(
  listing: Listing,
  evaluation: Evaluation,
  scoreResult: ScoreResult,
  fallback: FallbackNarrative,
): Promise<MemoNarrative> {
  try {
    return await generateMemoNarrative(listing, evaluation, scoreResult);
  } catch (err) {
    console.error("Memo narrative generation failed, using deterministic fallback:", err);
    return fallback;
  }
}
