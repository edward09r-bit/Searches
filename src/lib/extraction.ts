import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic } from "./claude";

const EXTRACTION_MODEL = "claude-sonnet-4-6";

// Mirrors the structured Listing fields. Every field except businessName/
// sdeVerified/isFranchise/extractionConfidence is nullable rather than
// optional — Claude's structured-output mode requires every key to be
// present, so "unknown" is represented as an explicit null, never omitted.
export const ExtractedListingSchema = z.object({
  businessName: z.string(),
  source: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  sourceListingId: z.string().nullable(),

  askingPrice: z.number().nullable(),
  annualRevenue: z.number().nullable(),
  annualSde: z.number().nullable(),
  annualEbitda: z.number().nullable(),
  sdeVerified: z.boolean(),

  employeeCount: z.number().int().nullable(),
  locationCity: z.string().nullable(),
  locationState: z.string().nullable(),
  industry: z.string().nullable(),
  subIndustry: z.string().nullable(),
  leaseStatus: z.string().nullable(),
  reasonForSale: z.string().nullable(),
  yearsInBusiness: z.number().int().nullable(),

  ffeValue: z.number().nullable(),
  inventoryValue: z.number().nullable(),
  downPaymentStated: z.number().nullable(),
  financingAvailable: z.boolean().nullable(),
  sellerNetWorthRequirement: z.number().nullable(),
  sellerLiquidityRequirement: z.number().nullable(),
  isFranchise: z.boolean(),
  franchiseName: z.string().nullable(),

  hasGmOrLeadOperator: z.boolean().nullable(),
  ownerHoursPerWeek: z.number().int().nullable(),

  notes: z.string().nullable(),

  extractionConfidence: z.enum(["high", "medium", "low"]),
});

export type ExtractedListing = z.infer<typeof ExtractedListingSchema>;

const EXTRACTION_SYSTEM_PROMPT = `You extract structured data from business-for-sale listing text for a buy-side acquisition screening tool. The buyer will make real financial decisions from this data, so follow these rules strictly:

1. Extract only values literally stated in the text. Never estimate, infer, or invent a number that isn't explicitly given — use null instead.
2. Money fields (askingPrice, annualRevenue, annualSde, annualEbitda, ffeValue, inventoryValue, downPaymentStated, sellerNetWorthRequirement, sellerLiquidityRequirement) are plain numbers in US dollars, no currency symbols or commas.
3. Set sdeVerified to true only if the text explicitly states the SDE/cash flow is supported by tax returns or financial statements. Otherwise false.
4. Set isFranchise to true only if the text explicitly identifies the business as a franchise.
5. Normalize locationState to its 2-letter US postal abbreviation (e.g. "California" -> "CA"). If the state can't be determined, use null.
6. financingAvailable and hasGmOrLeadOperator are tri-state: true if explicitly stated yes, false if explicitly stated no, null if the text doesn't address it.
7. businessName must always be a non-empty string. If no name is explicitly given, write a short neutral descriptive label drawn only from the text (e.g. "Established laundromat in San Diego") rather than leaving it blank. This is the one field where a label may be synthesized — every other field must come from explicit text or be null.
8. source is the marketplace, broker, or channel the listing came from (e.g. "BizBuySell", "Broker email") only if mentioned in the text; otherwise null — do not guess a platform that isn't named.
9. Set extractionConfidence to "high" if the key financial fields (asking price, revenue, SDE) are explicitly stated, "medium" if some are missing or ambiguous, "low" if the text is mostly marketing copy with little hard data.
10. Use notes for other relevant qualitative detail that doesn't fit a structured field — don't restate numbers already captured elsewhere.`;

export async function extractListingFromText(rawText: string): Promise<ExtractedListing> {
  const response = await anthropic.messages.parse({
    model: EXTRACTION_MODEL,
    max_tokens: 2048,
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: rawText }],
    output_config: {
      format: zodOutputFormat(ExtractedListingSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("Claude returned a response that didn't match the expected listing schema.");
  }

  return response.parsed_output;
}
