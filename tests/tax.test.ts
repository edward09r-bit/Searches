import { describe, expect, it } from "vitest";
import { calcBracketTax, calcFicaOnWages, type TaxBracketRow } from "../src/lib/tax";

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

describe("calcBracketTax", () => {
  it("matches hand-computed federal tax on $150,000 ordinary income (2025 single)", () => {
    // taxable = 150000 - 15750 = 134250; walks 10/12/22/24% brackets
    expect(calcBracketTax(150000, FEDERAL_2025_SINGLE)).toBeCloseTo(25067, 2);
  });

  it("matches hand-computed CA tax on $150,000 ordinary income (2025 single)", () => {
    // taxable = 150000 - 5706 = 144294; walks 1/2/4/6/8/9.3% brackets
    expect(calcBracketTax(150000, CA_2025_SINGLE)).toBeCloseTo(9857.98, 2);
  });

  it("returns 0 when income is below the standard deduction", () => {
    expect(calcBracketTax(10000, FEDERAL_2025_SINGLE)).toBe(0);
    expect(calcBracketTax(5000, CA_2025_SINGLE)).toBe(0);
  });

  it("taxes all income above $1,000,000 in CA at the 13.3% top bracket (12.3% + 1% surcharge)", () => {
    const taxOnExactlyOneMillionPlusDeduction = calcBracketTax(1000000 + 5706, CA_2025_SINGLE);
    const taxOnOneDollarMore = calcBracketTax(1000000 + 5706 + 1, CA_2025_SINGLE);
    expect(taxOnOneDollarMore - taxOnExactlyOneMillionPlusDeduction).toBeCloseTo(0.133, 5);
  });

  it("throws on an empty bracket array rather than silently returning 0", () => {
    expect(() => calcBracketTax(100000, [])).toThrow();
  });
});

describe("calcFicaOnWages", () => {
  it("matches hand-computed FICA on an $85,000 salary (well under the SS wage base)", () => {
    // 85000*0.062 + 85000*0.0145 = 5270 + 1232.5 = 6502.5
    expect(calcFicaOnWages(85000)).toBeCloseTo(6502.5, 2);
  });

  it("caps Social Security at the 2025 wage base of $176,100", () => {
    const wages = 300000;
    const expectedSs = 176100 * 0.062;
    const expectedMedicare = wages * 0.0145;
    const expectedAdditionalMedicare = (wages - 200000) * 0.009;
    expect(calcFicaOnWages(wages)).toBeCloseTo(expectedSs + expectedMedicare + expectedAdditionalMedicare, 2);
  });
});
