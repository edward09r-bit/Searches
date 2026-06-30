import type { Evaluation, Listing, ScoreResult } from "@prisma/client";

// Every export here is a pure function over already-computed Evaluation/
// ScoreResult/Listing fields — no LLM involvement, fully auditable, and
// exactly what gets persisted into the Memo's Json table columns.

export type FinancialOverviewTable = {
  askingPrice: number | null;
  annualRevenue: number | null;
  rawSde: number;
  sdeVerified: boolean;
  sdeHaircutPct: number;
  conservativeSde: number;
  annualEbitda: number | null;
  revenueMultiple: number | null;
  sdeMultiple: number | null;
};

export type CashFlowModelTable = {
  monthlyOperatingProfit: number;
  monthlyOpexEstimate: number;
  monthlyOwnerSalary: number;
  monthlyEstimatedDistributions: number;
  distributionsNegativeFlag: boolean;
};

export type SbaAssumptionsTable = {
  sbaLoanAmount: number;
  sbaRatePct: number;
  sbaTermMonths: number;
  sbaMonthlyPayment: number;
  sbaAnnualDebtService: number;
  dscr: number;
};

export type TaxEstimateTable = {
  filingStatus: string;
  stacksOnOtherIncome: boolean;
  otherOrdinaryIncome: number;
  federalTaxAnnual: number;
  caTaxAnnual: number;
  ficaAnnual: number;
};

export type OwnerPayStructureTable = {
  ownerAnnualSalary: number;
  monthlyOwnerSalary: number;
  monthlyEstimatedDistributions: number;
  baseMonthlyTakeHome: number;
};

export type ScenarioComparisonTable = {
  conservative: { monthlyTakeHome: number; annualTakeHome: number };
  base: { monthlyTakeHome: number; annualTakeHome: number };
  upside: { monthlyTakeHome: number; annualTakeHome: number };
};

export function buildFinancialOverviewTable(listing: Listing, evaluation: Evaluation): FinancialOverviewTable {
  return {
    askingPrice: listing.askingPrice,
    annualRevenue: listing.annualRevenue,
    rawSde: evaluation.rawSde,
    sdeVerified: listing.sdeVerified,
    sdeHaircutPct: evaluation.sdeHaircutPct,
    conservativeSde: evaluation.conservativeSde,
    annualEbitda: listing.annualEbitda,
    revenueMultiple: evaluation.revenueMultiple,
    sdeMultiple: evaluation.sdeMultiple,
  };
}

export function buildCashFlowModelTable(evaluation: Evaluation): CashFlowModelTable {
  return {
    monthlyOperatingProfit: evaluation.monthlyOperatingProfit,
    monthlyOpexEstimate: evaluation.monthlyOpexEstimate,
    monthlyOwnerSalary: evaluation.monthlyOwnerSalary,
    monthlyEstimatedDistributions: evaluation.monthlyEstimatedDistributions,
    distributionsNegativeFlag: evaluation.distributionsNegativeFlag,
  };
}

export function buildSbaAssumptionsTable(evaluation: Evaluation): SbaAssumptionsTable {
  return {
    sbaLoanAmount: evaluation.sbaLoanAmount,
    sbaRatePct: evaluation.sbaRatePct,
    sbaTermMonths: evaluation.sbaTermMonths,
    sbaMonthlyPayment: evaluation.sbaMonthlyPayment,
    sbaAnnualDebtService: evaluation.sbaAnnualDebtService,
    dscr: evaluation.dscr,
  };
}

export function buildTaxEstimateTable(evaluation: Evaluation): TaxEstimateTable {
  return {
    filingStatus: evaluation.filingStatus,
    stacksOnOtherIncome: evaluation.stacksOnOtherIncome,
    otherOrdinaryIncome: evaluation.otherOrdinaryIncome,
    federalTaxAnnual: evaluation.federalTaxAnnual,
    caTaxAnnual: evaluation.caTaxAnnual,
    ficaAnnual: evaluation.ficaAnnual,
  };
}

export function buildOwnerPayStructureTable(evaluation: Evaluation): OwnerPayStructureTable {
  return {
    ownerAnnualSalary: evaluation.ownerAnnualSalary,
    monthlyOwnerSalary: evaluation.monthlyOwnerSalary,
    monthlyEstimatedDistributions: evaluation.monthlyEstimatedDistributions,
    baseMonthlyTakeHome: evaluation.baseMonthlyTakeHome,
  };
}

export function buildScenarioComparisonTable(evaluation: Evaluation): ScenarioComparisonTable {
  return {
    conservative: {
      monthlyTakeHome: evaluation.conservativeMonthlyTakeHome,
      annualTakeHome: evaluation.conservativeAnnualTakeHome,
    },
    base: {
      monthlyTakeHome: evaluation.baseMonthlyTakeHome,
      annualTakeHome: evaluation.baseAnnualTakeHome,
    },
    upside: {
      monthlyTakeHome: evaluation.upsideMonthlyTakeHome,
      annualTakeHome: evaluation.upsideAnnualTakeHome,
    },
  };
}

export function buildFinalVerdict(evaluation: Evaluation, scoreResult: ScoreResult): string {
  const monthly = Math.round(evaluation.conservativeMonthlyTakeHome).toLocaleString();
  const dscr = evaluation.dscr.toFixed(2);
  const score = Math.round(scoreResult.finalScore);

  if (scoreResult.hardRejectTriggered) {
    const reasons = (scoreResult.hardRejectReasons as string[]).join("; ");
    return `PASS — hard-reject triggered (${reasons}). Raw weighted score ${Math.round(scoreResult.rawWeightedTotal)}/100 capped to ${score}/100.`;
  }

  switch (scoreResult.label) {
    case "STRONG_CANDIDATE":
      return `Strong candidate — ${score}/100. Conservative monthly take-home of $${monthly} with DSCR ${dscr}x supports the target range; proceed to deeper diligence.`;
    case "MAYBE":
      return `Maybe — ${score}/100. Conservative monthly take-home of $${monthly} with DSCR ${dscr}x is workable but below the strong-candidate bar; weigh the red flags before committing diligence time.`;
    default:
      return `Pass — ${score}/100. Conservative monthly take-home of $${monthly} with DSCR ${dscr}x does not clear the bar for this buyer profile.`;
  }
}

export type FallbackNarrative = {
  businessOverview: string;
  fitNarrative: string;
  redFlagsNarrative: string;
};

// Deterministic, template-based narrative with no LLM involvement. Used as
// the memo's narrative until the LLM narrative step is wired in, and as the
// fallback if that LLM call ever fails — memo generation should never
// hard-fail on the narrative alone.
export function buildFallbackNarrative(listing: Listing, scoreResult: ScoreResult): FallbackNarrative {
  const location = [listing.locationCity, listing.locationState].filter(Boolean).join(", ") || "an undisclosed location";
  const industry = listing.industry ?? "an unspecified industry";

  const businessOverview = `${listing.businessName} is a business in ${industry}, located in ${location}. ${
    listing.yearsInBusiness != null ? `It has been operating for ${listing.yearsInBusiness} years. ` : ""
  }${listing.reasonForSale ? `Stated reason for sale: ${listing.reasonForSale}.` : "Reason for sale is undisclosed."}`;

  const fitNarrative = `Semi-absentee fit score: ${Math.round(scoreResult.semiAbsenteeScore)}. ${
    listing.hasGmOrLeadOperator === true
      ? "Listing states a GM or lead operator is in place."
      : listing.hasGmOrLeadOperator === false
        ? "Listing states there is no GM or lead operator."
        : "GM / lead operator status is unstated."
  }${listing.ownerHoursPerWeek != null ? ` Owner hours/week reported: ${listing.ownerHoursPerWeek}.` : ""}`;

  const redFlags = scoreResult.redFlags as string[];
  const redFlagsNarrative =
    redFlags.length > 0 ? `Red flags identified: ${redFlags.join("; ")}.` : "No red flags were identified by the automated screen.";

  return { businessOverview, fitNarrative, redFlagsNarrative };
}
