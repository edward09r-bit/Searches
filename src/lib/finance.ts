import { calcBracketTax, calcFicaOnWages, type TaxBracketRow } from "./tax";

// Pure financial-model math. No DB access — all inputs are passed in by the
// caller so this module stays trivially unit-testable.

export function calcRevenueMultiple(askingPrice: number, annualRevenue: number): number | null {
  if (!annualRevenue || annualRevenue <= 0) return null;
  return askingPrice / annualRevenue;
}

export function calcSdeMultiple(askingPrice: number, conservativeSde: number): number | null {
  if (!conservativeSde || conservativeSde <= 0) return null;
  return askingPrice / conservativeSde;
}

// Verified SDE passes through unchanged; unverified SDE gets haircut by
// haircutPct (e.g. 12 for 12%) to account for unsubstantiated seller claims.
export function calcConservativeSde(rawSde: number, sdeVerified: boolean, haircutPct: number): number {
  if (sdeVerified) return rawSde;
  return rawSde * (1 - haircutPct / 100);
}

export function calcSbaLoanAmount(askingPrice: number, downPaymentPct: number): number {
  return askingPrice * (1 - downPaymentPct / 100);
}

// Standard amortization formula: P = L[i(1+i)^n]/[(1+i)^n-1]
export function calcSbaMonthlyPayment(loanAmount: number, annualRatePct: number, termMonths: number): number {
  const i = annualRatePct / 100 / 12;
  if (i === 0) return loanAmount / termMonths;
  const factor = Math.pow(1 + i, termMonths);
  return (loanAmount * (i * factor)) / (factor - 1);
}

export function calcAnnualDebtService(monthlyPayment: number): number {
  return monthlyPayment * 12;
}

export function calcDscr(monthlyOperatingProfit: number, monthlyDebtService: number): number {
  return monthlyOperatingProfit / monthlyDebtService;
}

// Approximation: there's no explicit opex field in the listing schema, so
// monthly opex is backed out from revenue and conservative SDE.
export function calcMonthlyOpex(annualRevenue: number, conservativeSde: number): number {
  return (annualRevenue - conservativeSde) / 12;
}

export function calcEstimatedDistributions(
  monthlyOperatingProfit: number,
  monthlyDebtService: number,
  monthlyOwnerSalary: number,
): { distributions: number; negativeFlag: boolean } {
  const raw = monthlyOperatingProfit - monthlyDebtService - monthlyOwnerSalary;
  return { distributions: Math.max(0, raw), negativeFlag: raw < 0 };
}

export type AfterTaxTakeHomeInputs = {
  annualOwnerSalary: number;
  annualDistributions: number;
  stacksOnOtherIncome: boolean;
  otherOrdinaryIncome: number;
  federalBrackets: TaxBracketRow[];
  caBrackets: TaxBracketRow[];
};

export type AfterTaxTakeHomeResult = {
  federalTaxAnnual: number;
  caTaxAnnual: number;
  ficaAnnual: number;
  annualTakeHome: number;
  monthlyTakeHome: number;
};

// S-corp model (see docs/assumptions.md): salary + distributions are both
// ordinary income for federal/CA tax purposes, but only the salary portion
// carries FICA. When stacking, the marginal tax attributable to the
// acquisition is isolated by diffing tax-on-(other+business) against
// tax-on-other-alone — this also correctly absorbs any of the standard
// deduction left unused by otherOrdinaryIncome.
export function calcAfterTaxTakeHome(inputs: AfterTaxTakeHomeInputs): AfterTaxTakeHomeResult {
  const businessOrdinaryIncome = inputs.annualOwnerSalary + inputs.annualDistributions;

  let federalTaxAnnual: number;
  let caTaxAnnual: number;

  if (inputs.stacksOnOtherIncome) {
    const totalIncome = inputs.otherOrdinaryIncome + businessOrdinaryIncome;
    federalTaxAnnual = calcBracketTax(totalIncome, inputs.federalBrackets) - calcBracketTax(inputs.otherOrdinaryIncome, inputs.federalBrackets);
    caTaxAnnual = calcBracketTax(totalIncome, inputs.caBrackets) - calcBracketTax(inputs.otherOrdinaryIncome, inputs.caBrackets);
  } else {
    federalTaxAnnual = calcBracketTax(businessOrdinaryIncome, inputs.federalBrackets);
    caTaxAnnual = calcBracketTax(businessOrdinaryIncome, inputs.caBrackets);
  }

  const ficaAnnual = calcFicaOnWages(inputs.annualOwnerSalary);
  const annualTakeHome = businessOrdinaryIncome - federalTaxAnnual - caTaxAnnual - ficaAnnual;

  return {
    federalTaxAnnual,
    caTaxAnnual,
    ficaAnnual,
    annualTakeHome,
    monthlyTakeHome: annualTakeHome / 12,
  };
}

export type RunEvaluationInputs = {
  askingPrice: number;
  annualRevenue: number;
  rawSde: number;
  sdeVerified: boolean;
  sdeHaircutPct: number;
  ownerAnnualSalary: number;
  sbaRatePct: number;
  sbaTermMonths: number;
  sbaDownPaymentPct: number;
  stacksOnOtherIncome: boolean;
  otherOrdinaryIncome: number;
  federalBrackets: TaxBracketRow[];
  caBrackets: TaxBracketRow[];
};

export type ScenarioResult = {
  scenarioSde: number;
  monthlyOperatingProfit: number;
  sbaLoanAmount: number;
  sbaMonthlyPayment: number;
  sbaAnnualDebtService: number;
  dscr: number;
  monthlyOwnerSalary: number;
  monthlyEstimatedDistributions: number;
  distributionsNegativeFlag: boolean;
  federalTaxAnnual: number;
  caTaxAnnual: number;
  ficaAnnual: number;
  annualTakeHome: number;
  monthlyTakeHome: number;
};

export type FullEvaluationResult = {
  revenueMultiple: number | null;
  sdeMultiple: number | null;
  monthlyOpexEstimate: number;
  base: ScenarioResult;
  conservative: ScenarioResult;
  upside: ScenarioResult;
};

// Financing terms (loan amount/payment) are constant across scenarios —
// only the SDE assumption driving cash flow varies.
function runScenario(inputs: RunEvaluationInputs, scenarioSde: number): ScenarioResult {
  const sbaLoanAmount = calcSbaLoanAmount(inputs.askingPrice, inputs.sbaDownPaymentPct);
  const sbaMonthlyPayment = calcSbaMonthlyPayment(sbaLoanAmount, inputs.sbaRatePct, inputs.sbaTermMonths);
  const sbaAnnualDebtService = calcAnnualDebtService(sbaMonthlyPayment);

  const monthlyOperatingProfit = scenarioSde / 12;
  const dscr = calcDscr(monthlyOperatingProfit, sbaMonthlyPayment);

  const monthlyOwnerSalary = inputs.ownerAnnualSalary / 12;
  const { distributions: monthlyEstimatedDistributions, negativeFlag: distributionsNegativeFlag } = calcEstimatedDistributions(
    monthlyOperatingProfit,
    sbaMonthlyPayment,
    monthlyOwnerSalary,
  );

  const { federalTaxAnnual, caTaxAnnual, ficaAnnual, annualTakeHome, monthlyTakeHome } = calcAfterTaxTakeHome({
    annualOwnerSalary: inputs.ownerAnnualSalary,
    annualDistributions: monthlyEstimatedDistributions * 12,
    stacksOnOtherIncome: inputs.stacksOnOtherIncome,
    otherOrdinaryIncome: inputs.otherOrdinaryIncome,
    federalBrackets: inputs.federalBrackets,
    caBrackets: inputs.caBrackets,
  });

  return {
    scenarioSde,
    monthlyOperatingProfit,
    sbaLoanAmount,
    sbaMonthlyPayment,
    sbaAnnualDebtService,
    dscr,
    monthlyOwnerSalary,
    monthlyEstimatedDistributions,
    distributionsNegativeFlag,
    federalTaxAnnual,
    caTaxAnnual,
    ficaAnnual,
    annualTakeHome,
    monthlyTakeHome,
  };
}

// Three scenarios: base (default haircut/salary — this is the persisted
// Evaluation and drives scoring), conservative (extra 10% stress on top of
// the base haircut), upside (raw, un-haircut SDE).
export function runFullEvaluation(inputs: RunEvaluationInputs): FullEvaluationResult {
  const baseConservativeSde = calcConservativeSde(inputs.rawSde, inputs.sdeVerified, inputs.sdeHaircutPct);
  const conservativeStressSde = baseConservativeSde * 0.9;

  const base = runScenario(inputs, baseConservativeSde);
  const conservative = runScenario(inputs, conservativeStressSde);
  const upside = runScenario(inputs, inputs.rawSde);

  return {
    revenueMultiple: calcRevenueMultiple(inputs.askingPrice, inputs.annualRevenue),
    sdeMultiple: calcSdeMultiple(inputs.askingPrice, baseConservativeSde),
    monthlyOpexEstimate: calcMonthlyOpex(inputs.annualRevenue, baseConservativeSde),
    base,
    conservative,
    upside,
  };
}
