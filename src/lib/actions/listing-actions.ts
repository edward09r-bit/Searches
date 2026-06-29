"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "../prisma";

// FormData gives every field back as a string (or omits unchecked
// checkboxes entirely) — these helpers normalize that into the
// null/boolean/number shapes the Prisma `Listing` model expects.
const toUndefinedIfEmpty = (val: unknown) => (typeof val === "string" && val.trim() === "" ? undefined : val);

const optionalString = z
  .preprocess(toUndefinedIfEmpty, z.string().optional())
  .transform((v) => v ?? null);

const optionalFloat = z
  .preprocess(toUndefinedIfEmpty, z.coerce.number().optional())
  .transform((v) => v ?? null);

const optionalInt = z
  .preprocess(toUndefinedIfEmpty, z.coerce.number().int().optional())
  .transform((v) => v ?? null);

// Rendered in the form as a 3-way <select> ("unknown" / "true" / "false")
// since a plain checkbox can't represent "don't know" for these fields.
const triStateBool = z.preprocess(
  (val) => (val === "true" ? true : val === "false" ? false : null),
  z.boolean().nullable(),
);

// Plain HTML checkboxes: present with value "on" when checked, absent
// entirely from FormData when unchecked.
const checkboxBool = z.preprocess((val) => val === "on", z.boolean());

export const ListingFormSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  source: z.string().min(1, "Source is required"),
  sourceUrl: optionalString,
  sourceListingId: optionalString,

  askingPrice: optionalFloat,
  annualRevenue: optionalFloat,
  annualSde: optionalFloat,
  annualEbitda: optionalFloat,
  sdeVerified: checkboxBool,

  employeeCount: optionalInt,
  locationCity: optionalString,
  locationState: optionalString,
  industry: optionalString,
  subIndustry: optionalString,
  leaseStatus: optionalString,
  reasonForSale: optionalString,
  yearsInBusiness: optionalInt,

  ffeValue: optionalFloat,
  inventoryValue: optionalFloat,
  downPaymentStated: optionalFloat,
  financingAvailable: triStateBool,
  sellerNetWorthRequirement: optionalFloat,
  sellerLiquidityRequirement: optionalFloat,
  isFranchise: checkboxBool,
  franchiseName: optionalString,

  hasGmOrLeadOperator: triStateBool,
  ownerHoursPerWeek: optionalInt,

  notes: optionalString,
  rawPastedText: optionalString,
});

export type ListingFormValues = z.infer<typeof ListingFormSchema>;

export type ListingFormState = {
  errors: Partial<Record<keyof ListingFormValues, string[]>>;
  message?: string;
};

export async function createListing(_prevState: ListingFormState, formData: FormData): Promise<ListingFormState> {
  const parsed = ListingFormSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const listing = await prisma.listing.create({
    data: {
      ...parsed.data,
      sourceHistory: { create: { action: "MANUAL_EDIT" } },
    },
  });

  redirect(`/listings/${listing.id}`);
}
