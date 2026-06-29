"use client";

import { useActionState } from "react";
import { createListing, type ListingFormState } from "@/lib/actions/listing-actions";
import type { ExtractedListing } from "@/lib/extraction";

const initialState: ListingFormState = { errors: {} };

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-sm text-red-600">{messages[0]}</p>;
}

const inputClass =
  "mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none";
const labelClass = "block text-sm font-medium text-zinc-700";

function triSelectDefault(value: boolean | null | undefined): "unknown" | "true" | "false" {
  if (value === true) return "true";
  if (value === false) return "false";
  return "unknown";
}

type ListingFormProps = {
  initialValues?: ExtractedListing;
  rawPastedText?: string;
};

export function ListingForm({ initialValues: v, rawPastedText }: ListingFormProps) {
  const [state, formAction, pending] = useActionState(createListing, initialState);

  return (
    <form action={formAction} className="mx-auto max-w-3xl space-y-8 pb-16">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Identity / Source</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="businessName">Business name *</label>
            <input id="businessName" name="businessName" defaultValue={v?.businessName ?? ""} className={inputClass} required />
            <FieldError messages={state.errors.businessName} />
          </div>
          <div>
            <label className={labelClass} htmlFor="source">Source *</label>
            <input
              id="source"
              name="source"
              defaultValue={v?.source ?? ""}
              className={inputClass}
              placeholder="BizBuySell, broker email, etc."
              required
            />
            <FieldError messages={state.errors.source} />
          </div>
          <div>
            <label className={labelClass} htmlFor="sourceUrl">Source URL</label>
            <input id="sourceUrl" name="sourceUrl" type="url" defaultValue={v?.sourceUrl ?? ""} className={inputClass} />
            <FieldError messages={state.errors.sourceUrl} />
          </div>
          <div>
            <label className={labelClass} htmlFor="sourceListingId">Source listing ID</label>
            <input id="sourceListingId" name="sourceListingId" defaultValue={v?.sourceListingId ?? ""} className={inputClass} />
            <FieldError messages={state.errors.sourceListingId} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Headline Financials</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="askingPrice">Asking price ($)</label>
            <input id="askingPrice" name="askingPrice" type="number" step="any" defaultValue={v?.askingPrice ?? ""} className={inputClass} />
            <FieldError messages={state.errors.askingPrice} />
          </div>
          <div>
            <label className={labelClass} htmlFor="annualRevenue">Annual revenue ($)</label>
            <input id="annualRevenue" name="annualRevenue" type="number" step="any" defaultValue={v?.annualRevenue ?? ""} className={inputClass} />
            <FieldError messages={state.errors.annualRevenue} />
          </div>
          <div>
            <label className={labelClass} htmlFor="annualSde">Annual SDE ($)</label>
            <input id="annualSde" name="annualSde" type="number" step="any" defaultValue={v?.annualSde ?? ""} className={inputClass} />
            <FieldError messages={state.errors.annualSde} />
          </div>
          <div>
            <label className={labelClass} htmlFor="annualEbitda">Annual EBITDA ($)</label>
            <input id="annualEbitda" name="annualEbitda" type="number" step="any" defaultValue={v?.annualEbitda ?? ""} className={inputClass} />
            <FieldError messages={state.errors.annualEbitda} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" name="sdeVerified" defaultChecked={v?.sdeVerified ?? false} className="rounded border-zinc-300" />
          SDE is verified by tax returns / financial statements
        </label>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Operating Profile</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="employeeCount">Employee count</label>
            <input id="employeeCount" name="employeeCount" type="number" step="1" defaultValue={v?.employeeCount ?? ""} className={inputClass} />
            <FieldError messages={state.errors.employeeCount} />
          </div>
          <div>
            <label className={labelClass} htmlFor="yearsInBusiness">Years in business</label>
            <input id="yearsInBusiness" name="yearsInBusiness" type="number" step="1" defaultValue={v?.yearsInBusiness ?? ""} className={inputClass} />
            <FieldError messages={state.errors.yearsInBusiness} />
          </div>
          <div>
            <label className={labelClass} htmlFor="locationCity">Location city</label>
            <input id="locationCity" name="locationCity" defaultValue={v?.locationCity ?? ""} className={inputClass} />
            <FieldError messages={state.errors.locationCity} />
          </div>
          <div>
            <label className={labelClass} htmlFor="locationState">Location state</label>
            <input
              id="locationState"
              name="locationState"
              maxLength={2}
              defaultValue={v?.locationState ?? ""}
              placeholder="CA"
              className={inputClass}
            />
            <FieldError messages={state.errors.locationState} />
          </div>
          <div>
            <label className={labelClass} htmlFor="industry">Industry</label>
            <input id="industry" name="industry" defaultValue={v?.industry ?? ""} className={inputClass} />
            <FieldError messages={state.errors.industry} />
          </div>
          <div>
            <label className={labelClass} htmlFor="subIndustry">Sub-industry</label>
            <input id="subIndustry" name="subIndustry" defaultValue={v?.subIndustry ?? ""} className={inputClass} />
            <FieldError messages={state.errors.subIndustry} />
          </div>
          <div className="col-span-2">
            <label className={labelClass} htmlFor="leaseStatus">Lease status</label>
            <input
              id="leaseStatus"
              name="leaseStatus"
              defaultValue={v?.leaseStatus ?? ""}
              placeholder="e.g. month-to-month, 5yr transferable lease, home-based"
              className={inputClass}
            />
            <FieldError messages={state.errors.leaseStatus} />
          </div>
          <div className="col-span-2">
            <label className={labelClass} htmlFor="reasonForSale">Reason for sale</label>
            <input id="reasonForSale" name="reasonForSale" defaultValue={v?.reasonForSale ?? ""} className={inputClass} />
            <FieldError messages={state.errors.reasonForSale} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Deal Structure</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="ffeValue">FF&E value ($)</label>
            <input id="ffeValue" name="ffeValue" type="number" step="any" defaultValue={v?.ffeValue ?? ""} className={inputClass} />
            <FieldError messages={state.errors.ffeValue} />
          </div>
          <div>
            <label className={labelClass} htmlFor="inventoryValue">Inventory value ($)</label>
            <input id="inventoryValue" name="inventoryValue" type="number" step="any" defaultValue={v?.inventoryValue ?? ""} className={inputClass} />
            <FieldError messages={state.errors.inventoryValue} />
          </div>
          <div>
            <label className={labelClass} htmlFor="downPaymentStated">Down payment stated ($)</label>
            <input
              id="downPaymentStated"
              name="downPaymentStated"
              type="number"
              step="any"
              defaultValue={v?.downPaymentStated ?? ""}
              className={inputClass}
            />
            <FieldError messages={state.errors.downPaymentStated} />
          </div>
          <div>
            <label className={labelClass} htmlFor="financingAvailable">Seller financing available?</label>
            <select id="financingAvailable" name="financingAvailable" defaultValue={triSelectDefault(v?.financingAvailable)} className={inputClass}>
              <option value="unknown">Unknown</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
            <FieldError messages={state.errors.financingAvailable} />
          </div>
          <div>
            <label className={labelClass} htmlFor="sellerNetWorthRequirement">Seller net worth requirement ($)</label>
            <input
              id="sellerNetWorthRequirement"
              name="sellerNetWorthRequirement"
              type="number"
              step="any"
              defaultValue={v?.sellerNetWorthRequirement ?? ""}
              className={inputClass}
            />
            <FieldError messages={state.errors.sellerNetWorthRequirement} />
          </div>
          <div>
            <label className={labelClass} htmlFor="sellerLiquidityRequirement">Seller liquidity requirement ($)</label>
            <input
              id="sellerLiquidityRequirement"
              name="sellerLiquidityRequirement"
              type="number"
              step="any"
              defaultValue={v?.sellerLiquidityRequirement ?? ""}
              className={inputClass}
            />
            <FieldError messages={state.errors.sellerLiquidityRequirement} />
          </div>
          <div>
            <label className={labelClass} htmlFor="franchiseName">Franchise name (if applicable)</label>
            <input id="franchiseName" name="franchiseName" defaultValue={v?.franchiseName ?? ""} className={inputClass} />
            <FieldError messages={state.errors.franchiseName} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" name="isFranchise" defaultChecked={v?.isFranchise ?? false} className="rounded border-zinc-300" />
          This is a franchise
        </label>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Buyer-Fit Inference</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="hasGmOrLeadOperator">Has GM / lead operator?</label>
            <select
              id="hasGmOrLeadOperator"
              name="hasGmOrLeadOperator"
              defaultValue={triSelectDefault(v?.hasGmOrLeadOperator)}
              className={inputClass}
            >
              <option value="unknown">Unknown</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
            <FieldError messages={state.errors.hasGmOrLeadOperator} />
          </div>
          <div>
            <label className={labelClass} htmlFor="ownerHoursPerWeek">Owner hours / week</label>
            <input
              id="ownerHoursPerWeek"
              name="ownerHoursPerWeek"
              type="number"
              step="1"
              defaultValue={v?.ownerHoursPerWeek ?? ""}
              className={inputClass}
            />
            <FieldError messages={state.errors.ownerHoursPerWeek} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Notes</h2>
        <div>
          <label className={labelClass} htmlFor="notes">Notes</label>
          <textarea id="notes" name="notes" rows={3} defaultValue={v?.notes ?? ""} className={inputClass} />
          <FieldError messages={state.errors.notes} />
        </div>
        <div>
          <label className={labelClass} htmlFor="rawPastedText">Raw pasted listing text (optional, kept for reference)</label>
          <textarea id="rawPastedText" name="rawPastedText" rows={6} defaultValue={rawPastedText ?? ""} className={inputClass} />
          <FieldError messages={state.errors.rawPastedText} />
        </div>
      </section>

      {state.message && <p className="text-sm text-red-600">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save listing"}
      </button>
    </form>
  );
}
