// Pure tax math. No DB access — bracket data is passed in by the caller
// (loaded from the TaxBracket table), so this module has no knowledge of
// which tax year or jurisdiction it's computing for.

export type TaxBracketRow = {
  bracketOrder: number;
  rate: number;
  minIncome: number;
  maxIncome: number | null;
  standardDeduction: number;
};

// Walks a marginal-rate bracket schedule against gross ordinary income,
// applying the standard deduction first. All rows in `brackets` must share
// the same standardDeduction (one jurisdiction/filingStatus/taxYear group).
export function calcBracketTax(grossOrdinaryIncome: number, brackets: TaxBracketRow[]): number {
  if (brackets.length === 0) {
    throw new Error("calcBracketTax: no brackets provided");
  }

  const taxableIncome = Math.max(0, grossOrdinaryIncome - brackets[0].standardDeduction);
  const sorted = [...brackets].sort((a, b) => a.bracketOrder - b.bracketOrder);

  let tax = 0;
  for (const bracket of sorted) {
    if (taxableIncome <= bracket.minIncome) break;
    const upperBound = bracket.maxIncome === null ? taxableIncome : Math.min(taxableIncome, bracket.maxIncome);
    const amountInBracket = upperBound - bracket.minIncome;
    if (amountInBracket > 0) {
      tax += amountInBracket * bracket.rate;
    }
  }
  return tax;
}

// 2025 FICA constants (single-filer Additional Medicare threshold — only
// "single" is seeded/supported in this version). See docs/assumptions.md.
export const SOCIAL_SECURITY_RATE_2025 = 0.062;
export const SOCIAL_SECURITY_WAGE_BASE_2025 = 176100;
export const MEDICARE_RATE_2025 = 0.0145;
export const ADDITIONAL_MEDICARE_RATE_2025 = 0.009;
export const ADDITIONAL_MEDICARE_THRESHOLD_SINGLE_2025 = 200000;

// Employee-side FICA on W-2 wages only — the S-corp modeling assumption
// (see docs/assumptions.md) means distributions carry no FICA/SE tax, so
// this is never called on the distributions portion of owner pay.
export function calcFicaOnWages(annualWages: number): number {
  const socialSecurity = Math.min(annualWages, SOCIAL_SECURITY_WAGE_BASE_2025) * SOCIAL_SECURITY_RATE_2025;
  const medicare = annualWages * MEDICARE_RATE_2025;
  const additionalMedicare = Math.max(0, annualWages - ADDITIONAL_MEDICARE_THRESHOLD_SINGLE_2025) * ADDITIONAL_MEDICARE_RATE_2025;
  return socialSecurity + medicare + additionalMedicare;
}
