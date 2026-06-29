import { describe, expect, it } from "vitest";
import {
  calcAfterTaxTakeHome,
  calcAnnualDebtService,
  calcConservativeSde,
  calcDscr,
  calcEstimatedDistributions,
  calcMonthlyOpex,
  calcRevenueMultiple,
  calcSbaLoanAmount,
  calcSbaMonthlyPayment,
  calcSdeMultiple,
  runFullEvaluation,
} from "../src/lib/finance";
import type { TaxBracketRow } from "../src/lib/tax";

const FEDERAL_2025_SINGLE: TaxBracketRow[] = [
  { bracketOrder: 1, rate: 0.1, minIncome: 0, maxIncome: 11925, standardDeduction: 15750 },
  { bracketOrder: 2, rate: 0.12, minIncome: 11925, maxIncome: 48475, standardDeduction: 15750 },
  { bracketOrder: 3, rate: 0.22, minIncome: 48475, maxIncome: 103350, standardDeduction: 15750 },
  { bracketOrder: 4, rate: 0.24, minIncome: 103350, maxIncome: 197300, standardDeduction: 15750 },
  { bracketOrder: 5, rate: 0.32, minIncome: 197300, maxIncome: 250525, standardDeduction: 15750 },
  { bracketOrder: 6, rate: 0.35, minIncome: 250525, maxIncome: 626350, standardDeduction: 15750 },
  { bracketOrder: 7, rate: 0.37, minIncome: 626350, maxIncome: null, standardDeduction: 15750 },
];

const CA_2025_SINGLE: TaxBracketRow[] = [
  { bracketOrder: 1, rate: 0.01, minIncome: 0, maxIncome: 11079, standardDeduction: 5706 },
  { bracketOrder: 2, rate: 0.02, minIncome: 11079, maxIncome: 26264, standardDeduction: 5706 },
  { bracketOrder: 3, rate: 0.04, minIncome: 26264, maxIncome: 41452, standardDeduction: 5706 },
  { bracketOrder: 4, rate: 0.06, minIncome: 41452, maxIncome: 57542, standardDeduction: 5706 },
  { bracketOrder: 5, rate: 0.08, minIncome: 57542, maxIncome: 72724, standardDeduction: 5706 },
  { bracketOrder: 6, rate: 0.093, minIncome: 72724, maxIncome: 371479, standardDeduction: 5706 },
  { bracketOrder: 7, rate: 0.103, minIncome: 371479, maxIncome: 445771, standardDeduction: 5706 },
  { bracketOrder: 8, rate: 0.113, minIncome: 445771, maxIncome: 742953, standardDeduction: 5706 },
  { bracketOrder: 9, rate: 0.123, minIncome: 742953, maxIncome: 1000000, standardDeduction: 5706 },
  { bracketOrder: 10, rate: 0.133, minIncome: 1000000, maxIncome: null, standardDeduction: 5706 },
];

describe("calcSbaMonthlyPayment", () => {
  it("matches hand-computed amortization for $500,000 at 9.75% over 120 months", () => {
    // P = L[i(1+i)^n]/[(1+i)^n-1], i = 0.0975/12, n = 120 -> 6538.5121
    expect(calcSbaMonthlyPayment(500000, 9.75, 120)).toBeCloseTo(6538.5121, 3);
  });

  it("falls back to straight-line division at 0% interest", () => {
    expect(calcSbaMonthlyPayment(120000, 0, 120)).toBeCloseTo(1000, 6);
  });
});

describe("calcAnnualDebtService", () => {
  it("multiplies monthly payment by 12", () => {
    expect(calcAnnualDebtService(6538.5121)).toBeCloseTo(78462.1452, 3);
  });
});

describe("calcConservativeSde", () => {
  it("passes verified SDE through unchanged", () => {
    expect(calcConservativeSde(200000, true, 12)).toBe(200000);
  });

  it("applies the haircut to unverified SDE", () => {
    expect(calcConservativeSde(200000, false, 12)).toBeCloseTo(176000, 5);
  });
});

describe("calcRevenueMultiple / calcSdeMultiple", () => {
  it("computes price-to-revenue and price-to-SDE multiples", () => {
    expect(calcRevenueMultiple(900000, 600000)).toBeCloseTo(1.5, 5);
    expect(calcSdeMultiple(900000, 300000)).toBeCloseTo(3, 5);
  });

  it("returns null rather than dividing by zero when revenue/SDE is missing", () => {
    expect(calcRevenueMultiple(900000, 0)).toBeNull();
    expect(calcSdeMultiple(900000, 0)).toBeNull();
  });
});

describe("calcSbaLoanAmount", () => {
  it("subtracts the down payment percentage from asking price", () => {
    expect(calcSbaLoanAmount(900000, 10)).toBeCloseTo(810000, 5);
  });
});

describe("calcDscr", () => {
  it("divides operating profit by debt service", () => {
    expect(calcDscr(10000, 8000)).toBeCloseTo(1.25, 5);
  });
});

describe("calcMonthlyOpex", () => {
  it("backs out monthly opex from revenue minus conservative SDE", () => {
    expect(calcMonthlyOpex(600000, 240000)).toBeCloseTo(30000, 5);
  });
});

describe("calcEstimatedDistributions", () => {
  it("floors distributions at 0 and flags when cash flow is negative", () => {
    const positive = calcEstimatedDistributions(20000, 6500, 7083.33);
    expect(positive.distributions).toBeCloseTo(6416.67, 1);
    expect(positive.negativeFlag).toBe(false);

    const negative = calcEstimatedDistributions(10000, 6500, 7083.33);
    expect(negative.distributions).toBe(0);
    expect(negative.negativeFlag).toBe(true);
  });
});

describe("calcAfterTaxTakeHome", () => {
  it("matches hand-computed standalone take-home for $85k salary + $65k distributions (single, no stacking)", () => {
    // businessOrdinaryIncome = 150000 -> fed 25067, CA 9857.98 (hand-verified separately)
    // FICA on 85000 salary only = 6502.5
    const result = calcAfterTaxTakeHome({
      annualOwnerSalary: 85000,
      annualDistributions: 65000,
      stacksOnOtherIncome: false,
      otherOrdinaryIncome: 0,
      federalBrackets: FEDERAL_2025_SINGLE,
      caBrackets: CA_2025_SINGLE,
    });
    expect(result.federalTaxAnnual).toBeCloseTo(25067, 2);
    expect(result.caTaxAnnual).toBeCloseTo(9857.98, 2);
    expect(result.ficaAnnual).toBeCloseTo(6502.5, 2);
    expect(result.annualTakeHome).toBeCloseTo(150000 - 25067 - 9857.98 - 6502.5, 2);
    expect(result.monthlyTakeHome).toBeCloseTo(result.annualTakeHome / 12, 5);
  });

  it("ignores otherOrdinaryIncome when stacksOnOtherIncome is false", () => {
    const withOther = calcAfterTaxTakeHome({
      annualOwnerSalary: 85000,
      annualDistributions: 65000,
      stacksOnOtherIncome: false,
      otherOrdinaryIncome: 500000,
      federalBrackets: FEDERAL_2025_SINGLE,
      caBrackets: CA_2025_SINGLE,
    });
    const withoutOther = calcAfterTaxTakeHome({
      annualOwnerSalary: 85000,
      annualDistributions: 65000,
      stacksOnOtherIncome: false,
      otherOrdinaryIncome: 0,
      federalBrackets: FEDERAL_2025_SINGLE,
      caBrackets: CA_2025_SINGLE,
    });
    expect(withOther.federalTaxAnnual).toBeCloseTo(withoutOther.federalTaxAnnual, 5);
  });

  it("isolates the marginal tax attributable to the business when stacking is enabled", () => {
    const businessOnly = calcAfterTaxTakeHome({
      annualOwnerSalary: 85000,
      annualDistributions: 65000,
      stacksOnOtherIncome: false,
      otherOrdinaryIncome: 0,
      federalBrackets: FEDERAL_2025_SINGLE,
      caBrackets: CA_2025_SINGLE,
    });
    const stacked = calcAfterTaxTakeHome({
      annualOwnerSalary: 85000,
      annualDistributions: 65000,
      stacksOnOtherIncome: true,
      otherOrdinaryIncome: 100000,
      federalBrackets: FEDERAL_2025_SINGLE,
      caBrackets: CA_2025_SINGLE,
    });
    // Stacking on top of $100k other income pushes the business income into
    // higher brackets than starting from $0, so marginal tax must be higher.
    expect(stacked.federalTaxAnnual).toBeGreaterThan(businessOnly.federalTaxAnnual);
    expect(stacked.caTaxAnnual).toBeGreaterThan(businessOnly.caTaxAnnual);
  });
});

describe("runFullEvaluation", () => {
  const baseInputs = {
    askingPrice: 900000,
    annualRevenue: 600000,
    rawSde: 250000,
    sdeVerified: false,
    sdeHaircutPct: 12,
    ownerAnnualSalary: 85000,
    sbaRatePct: 9.75,
    sbaTermMonths: 120,
    sbaDownPaymentPct: 10,
    stacksOnOtherIncome: false,
    otherOrdinaryIncome: 0,
    federalBrackets: FEDERAL_2025_SINGLE,
    caBrackets: CA_2025_SINGLE,
  };

  it("orders scenario SDE as conservative < base < upside", () => {
    const result = runFullEvaluation(baseInputs);
    expect(result.conservative.scenarioSde).toBeLessThan(result.base.scenarioSde);
    expect(result.base.scenarioSde).toBeLessThan(result.upside.scenarioSde);
    expect(result.upside.scenarioSde).toBeCloseTo(baseInputs.rawSde, 5);
  });

  it("orders take-home consistently with scenario SDE", () => {
    const result = runFullEvaluation(baseInputs);
    expect(result.conservative.annualTakeHome).toBeLessThan(result.base.annualTakeHome);
    expect(result.base.annualTakeHome).toBeLessThan(result.upside.annualTakeHome);
  });

  it("keeps financing terms identical across all three scenarios", () => {
    const result = runFullEvaluation(baseInputs);
    expect(result.base.sbaLoanAmount).toBe(result.conservative.sbaLoanAmount);
    expect(result.base.sbaLoanAmount).toBe(result.upside.sbaLoanAmount);
    expect(result.base.sbaMonthlyPayment).toBe(result.conservative.sbaMonthlyPayment);
    expect(result.base.sbaMonthlyPayment).toBe(result.upside.sbaMonthlyPayment);
  });

  it("computes sensible revenue and SDE multiples off the base scenario", () => {
    const result = runFullEvaluation(baseInputs);
    const expectedConservativeSde = 250000 * 0.88;
    expect(result.sdeMultiple).toBeCloseTo(900000 / expectedConservativeSde, 4);
    expect(result.revenueMultiple).toBeCloseTo(900000 / 600000, 5);
  });
});
