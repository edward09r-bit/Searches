import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { runEvaluation } from "@/lib/actions/evaluation-actions";

// Next.js 16: `params` is a Promise with no synchronous-access fallback.
export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      evaluations: {
        where: { isCurrent: true },
        include: { scoreResult: true },
        take: 1,
      },
    },
  });

  if (!listing) notFound();

  const evaluation = listing.evaluations[0] ?? null;
  const score = evaluation?.scoreResult ?? null;

  const fmtMoney = (v: number | null) => (v != null ? `$${Math.round(v).toLocaleString()}` : "—");
  const fmtBool = (v: boolean | null) => (v === null ? "Unknown" : v ? "Yes" : "No");

  const boundRunEvaluation = runEvaluation.bind(null, listing.id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">{listing.businessName}</h1>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium uppercase text-zinc-600">
          {listing.currentStatus}
        </span>
      </div>
      <p className="mt-1 text-sm text-zinc-500">
        {[listing.locationCity, listing.locationState].filter(Boolean).join(", ") || "Location unknown"}
        {listing.industry ? ` · ${listing.industry}` : ""}
        {listing.subIndustry ? ` (${listing.subIndustry})` : ""}
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Headline financials</h2>
        <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-zinc-500">Asking price</dt><dd>{fmtMoney(listing.askingPrice)}</dd></div>
          <div><dt className="text-zinc-500">Annual revenue</dt><dd>{fmtMoney(listing.annualRevenue)}</dd></div>
          <div><dt className="text-zinc-500">Annual SDE</dt><dd>{fmtMoney(listing.annualSde)}</dd></div>
          <div><dt className="text-zinc-500">Annual EBITDA</dt><dd>{fmtMoney(listing.annualEbitda)}</dd></div>
          <div><dt className="text-zinc-500">SDE verified</dt><dd>{fmtBool(listing.sdeVerified)}</dd></div>
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Operating profile</h2>
        <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-zinc-500">Employee count</dt><dd>{listing.employeeCount ?? "Unknown"}</dd></div>
          <div><dt className="text-zinc-500">Years in business</dt><dd>{listing.yearsInBusiness ?? "Unknown"}</dd></div>
          <div className="col-span-2"><dt className="text-zinc-500">Lease status</dt><dd>{listing.leaseStatus ?? "Unknown"}</dd></div>
          <div className="col-span-2"><dt className="text-zinc-500">Reason for sale</dt><dd>{listing.reasonForSale ?? "Undisclosed"}</dd></div>
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Deal structure</h2>
        <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-zinc-500">FF&E value</dt><dd>{fmtMoney(listing.ffeValue)}</dd></div>
          <div><dt className="text-zinc-500">Inventory value</dt><dd>{fmtMoney(listing.inventoryValue)}</dd></div>
          <div><dt className="text-zinc-500">Down payment stated</dt><dd>{fmtMoney(listing.downPaymentStated)}</dd></div>
          <div><dt className="text-zinc-500">Seller financing available</dt><dd>{fmtBool(listing.financingAvailable)}</dd></div>
          <div><dt className="text-zinc-500">Franchise</dt><dd>{listing.isFranchise ? listing.franchiseName ?? "Yes" : "No"}</dd></div>
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Buyer-fit inference</h2>
        <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-zinc-500">Has GM / lead operator</dt><dd>{fmtBool(listing.hasGmOrLeadOperator)}</dd></div>
          <div><dt className="text-zinc-500">Owner hours / week</dt><dd>{listing.ownerHoursPerWeek ?? "Unknown"}</dd></div>
        </dl>
      </section>

      {listing.notes && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">{listing.notes}</p>
        </section>
      )}

      <section className="mt-10 border-t border-zinc-200 pt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Financial evaluation</h2>
          {listing.askingPrice && listing.askingPrice > 0 ? (
            <form action={boundRunEvaluation}>
              <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
                {evaluation ? "Re-run evaluation" : "Run evaluation"}
              </button>
            </form>
          ) : (
            <p className="text-sm text-zinc-400">Add an asking price to run an evaluation.</p>
          )}
        </div>

        {!evaluation && <p className="mt-4 text-sm text-zinc-400">No evaluation has been run for this listing yet.</p>}

        {evaluation && score && (
          <div className="mt-4 space-y-6">
            <div className="flex items-center gap-4">
              <span
                className={`rounded-full px-4 py-2 text-lg font-bold ${
                  score.label === "STRONG_CANDIDATE"
                    ? "bg-green-100 text-green-800"
                    : score.label === "MAYBE"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {Math.round(score.finalScore)} / 100
              </span>
              <div>
                <p className="font-medium">{score.label.replace("_", " ")}</p>
                {score.hardRejectTriggered && (
                  <p className="text-xs text-red-600">Hard-reject cap applied (raw score {Math.round(score.rawWeightedTotal)})</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-700">Take-home (monthly, after CA + federal tax + FICA)</h3>
              <dl className="mt-2 grid grid-cols-3 gap-3 text-sm">
                <div><dt className="text-zinc-500">Conservative</dt><dd className="font-medium">{fmtMoney(evaluation.conservativeMonthlyTakeHome)}</dd></div>
                <div><dt className="text-zinc-500">Base</dt><dd className="font-medium">{fmtMoney(evaluation.baseMonthlyTakeHome)}</dd></div>
                <div><dt className="text-zinc-500">Upside</dt><dd className="font-medium">{fmtMoney(evaluation.upsideMonthlyTakeHome)}</dd></div>
              </dl>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-700">SBA debt service (base scenario)</h3>
              <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-zinc-500">Loan amount</dt><dd>{fmtMoney(evaluation.sbaLoanAmount)}</dd></div>
                <div><dt className="text-zinc-500">Monthly payment</dt><dd>{fmtMoney(evaluation.sbaMonthlyPayment)}</dd></div>
                <div><dt className="text-zinc-500">Rate / term</dt><dd>{evaluation.sbaRatePct}% / {evaluation.sbaTermMonths}mo</dd></div>
                <div><dt className="text-zinc-500">DSCR</dt><dd>{evaluation.dscr.toFixed(2)}x</dd></div>
              </dl>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-700">Multiples</h3>
              <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-zinc-500">SDE multiple</dt><dd>{evaluation.sdeMultiple != null ? `${evaluation.sdeMultiple.toFixed(2)}x` : "—"}</dd></div>
                <div><dt className="text-zinc-500">Revenue multiple</dt><dd>{evaluation.revenueMultiple != null ? `${evaluation.revenueMultiple.toFixed(2)}x` : "—"}</dd></div>
              </dl>
            </div>

            {(score.redFlags as string[]).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-700">Red flags</h3>
                <ul className="mt-2 list-inside list-disc text-sm text-red-700">
                  {(score.redFlags as string[]).map((flag) => (
                    <li key={flag}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}

            {(score.hardRejectReasons as string[]).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-700">Hard-reject reasons</h3>
                <ul className="mt-2 list-inside list-disc text-sm text-red-700">
                  {(score.hardRejectReasons as string[]).map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
