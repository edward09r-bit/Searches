import type { Memo } from "@prisma/client";
import type {
  FinancialOverviewTable,
  CashFlowModelTable,
  SbaAssumptionsTable,
  TaxEstimateTable,
  OwnerPayStructureTable,
  ScenarioComparisonTable,
} from "@/lib/memo";

const fmtMoney = (v: number | null) => (v != null ? `$${Math.round(v).toLocaleString()}` : "—");
const fmtPct = (v: number) => `${v.toFixed(1)}%`;
const fmtMultiple = (v: number | null) => (v != null ? `${v.toFixed(2)}x` : "—");

export function MemoView({ memo }: { memo: Memo }) {
  const financialOverview = memo.financialOverviewTable as unknown as FinancialOverviewTable;
  const cashFlowModel = memo.cashFlowModelTable as unknown as CashFlowModelTable;
  const sbaAssumptions = memo.sbaAssumptionsTable as unknown as SbaAssumptionsTable;
  const taxEstimate = memo.taxEstimateTable as unknown as TaxEstimateTable;
  const ownerPayStructure = memo.ownerPayStructureTable as unknown as OwnerPayStructureTable;
  const scenarioComparison = memo.scenarioComparisonTable as unknown as ScenarioComparisonTable;

  return (
    <div className="space-y-8">
      <section className="rounded-md bg-zinc-50 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Final verdict</h2>
        <p className="mt-2 text-base font-medium text-zinc-900">{memo.finalVerdict}</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Business overview</h2>
        <p className="mt-2 text-sm text-zinc-700">{memo.businessOverview}</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Financial overview</h2>
        <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-zinc-500">Asking price</dt><dd>{fmtMoney(financialOverview.askingPrice)}</dd></div>
          <div><dt className="text-zinc-500">Annual revenue</dt><dd>{fmtMoney(financialOverview.annualRevenue)}</dd></div>
          <div><dt className="text-zinc-500">Raw SDE</dt><dd>{fmtMoney(financialOverview.rawSde)}</dd></div>
          <div><dt className="text-zinc-500">SDE verified</dt><dd>{financialOverview.sdeVerified ? "Yes" : "No"}</dd></div>
          <div><dt className="text-zinc-500">SDE haircut</dt><dd>{fmtPct(financialOverview.sdeHaircutPct)}</dd></div>
          <div><dt className="text-zinc-500">Conservative SDE</dt><dd>{fmtMoney(financialOverview.conservativeSde)}</dd></div>
          <div><dt className="text-zinc-500">Annual EBITDA</dt><dd>{fmtMoney(financialOverview.annualEbitda)}</dd></div>
          <div><dt className="text-zinc-500">Revenue multiple</dt><dd>{fmtMultiple(financialOverview.revenueMultiple)}</dd></div>
          <div><dt className="text-zinc-500">SDE multiple</dt><dd>{fmtMultiple(financialOverview.sdeMultiple)}</dd></div>
        </dl>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Cash flow model (monthly)</h2>
        <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-zinc-500">Operating profit</dt><dd>{fmtMoney(cashFlowModel.monthlyOperatingProfit)}</dd></div>
          <div><dt className="text-zinc-500">Opex estimate</dt><dd>{fmtMoney(cashFlowModel.monthlyOpexEstimate)}</dd></div>
          <div><dt className="text-zinc-500">Owner salary</dt><dd>{fmtMoney(cashFlowModel.monthlyOwnerSalary)}</dd></div>
          <div><dt className="text-zinc-500">Estimated distributions</dt><dd>{fmtMoney(cashFlowModel.monthlyEstimatedDistributions)}</dd></div>
        </dl>
        {cashFlowModel.distributionsNegativeFlag && (
          <p className="mt-2 text-xs text-red-600">
            Distributions floored at $0 — operating profit doesn&apos;t cover debt service + owner salary in this scenario.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">SBA assumptions</h2>
        <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-zinc-500">Loan amount</dt><dd>{fmtMoney(sbaAssumptions.sbaLoanAmount)}</dd></div>
          <div><dt className="text-zinc-500">Rate / term</dt><dd>{sbaAssumptions.sbaRatePct}% / {sbaAssumptions.sbaTermMonths}mo</dd></div>
          <div><dt className="text-zinc-500">Monthly payment</dt><dd>{fmtMoney(sbaAssumptions.sbaMonthlyPayment)}</dd></div>
          <div><dt className="text-zinc-500">Annual debt service</dt><dd>{fmtMoney(sbaAssumptions.sbaAnnualDebtService)}</dd></div>
          <div><dt className="text-zinc-500">DSCR</dt><dd>{sbaAssumptions.dscr.toFixed(2)}x</dd></div>
        </dl>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Tax estimate (annual)</h2>
        <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-zinc-500">Filing status</dt><dd>{taxEstimate.filingStatus}</dd></div>
          <div><dt className="text-zinc-500">Stacks on other income</dt><dd>{taxEstimate.stacksOnOtherIncome ? "Yes" : "No"}</dd></div>
          {taxEstimate.stacksOnOtherIncome && (
            <div><dt className="text-zinc-500">Other ordinary income</dt><dd>{fmtMoney(taxEstimate.otherOrdinaryIncome)}</dd></div>
          )}
          <div><dt className="text-zinc-500">Federal tax</dt><dd>{fmtMoney(taxEstimate.federalTaxAnnual)}</dd></div>
          <div><dt className="text-zinc-500">CA tax</dt><dd>{fmtMoney(taxEstimate.caTaxAnnual)}</dd></div>
          <div><dt className="text-zinc-500">FICA</dt><dd>{fmtMoney(taxEstimate.ficaAnnual)}</dd></div>
        </dl>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Owner pay structure</h2>
        <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-zinc-500">Owner salary (annual)</dt><dd>{fmtMoney(ownerPayStructure.ownerAnnualSalary)}</dd></div>
          <div><dt className="text-zinc-500">Owner salary (monthly)</dt><dd>{fmtMoney(ownerPayStructure.monthlyOwnerSalary)}</dd></div>
          <div><dt className="text-zinc-500">Est. distributions (monthly)</dt><dd>{fmtMoney(ownerPayStructure.monthlyEstimatedDistributions)}</dd></div>
          <div><dt className="text-zinc-500">Base monthly take-home</dt><dd className="font-medium">{fmtMoney(ownerPayStructure.baseMonthlyTakeHome)}</dd></div>
        </dl>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Scenario comparison (monthly take-home)</h2>
        <dl className="mt-2 grid grid-cols-3 gap-3 text-sm">
          <div><dt className="text-zinc-500">Conservative</dt><dd className="font-medium">{fmtMoney(scenarioComparison.conservative.monthlyTakeHome)}</dd></div>
          <div><dt className="text-zinc-500">Base</dt><dd className="font-medium">{fmtMoney(scenarioComparison.base.monthlyTakeHome)}</dd></div>
          <div><dt className="text-zinc-500">Upside</dt><dd className="font-medium">{fmtMoney(scenarioComparison.upside.monthlyTakeHome)}</dd></div>
        </dl>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Semi-absentee fit</h2>
        <p className="mt-2 text-sm text-zinc-700">{memo.fitNarrative}</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Red flags</h2>
        <p className="mt-2 text-sm text-zinc-700">{memo.redFlagsNarrative}</p>
      </section>
    </div>
  );
}
