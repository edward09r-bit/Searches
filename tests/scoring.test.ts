import { describe, expect, it } from "vitest";
import {
  applyHardRejectRules,
  classifyLeaseStabilityPct,
  detectRedFlags,
  scoreDscr,
  scoreIndustryQuality,
  scoreLeaseStability,
  scoreListing,
  scoreRedFlags,
  scoreSemiAbsenteeFit,
  scoreStaffDepth,
  scoreTakeHome,
  scoreValuationMultiple,
  type ScoringInput,
  type ScoringWeights,
} from "../src/lib/scoring";

const WEIGHTS: ScoringWeights = {
  dscr: 25,
  takeHome: 25,
  semiAbsentee: 15,
  staffDepth: 10,
  leaseStability: 10,
  industryQuality: 5,
  valuationMultiple: 5,
  redFlags: 5,
};

describe("scoreDscr", () => {
  it("scores 0 at or below 1.0x", () => {
    expect(scoreDscr(1.0, 25)).toBe(0);
    expect(scoreDscr(0.8, 25)).toBe(0);
  });

  it("scores full weight at or above 1.5x", () => {
    expect(scoreDscr(1.5, 25)).toBe(25);
    expect(scoreDscr(2.0, 25)).toBe(25);
  });

  it("scores linearly between 1.0x and 1.5x", () => {
    expect(scoreDscr(1.25, 25)).toBeCloseTo(12.5, 5);
    expect(scoreDscr(1.3, 25)).toBeCloseTo(15, 5);
  });
});

describe("scoreTakeHome", () => {
  it("scores 0 at or below $0/month", () => {
    expect(scoreTakeHome(0, 10000, 15000, 25)).toBe(0);
    expect(scoreTakeHome(-500, 10000, 15000, 25)).toBe(0);
  });

  it("scores up to half weight below target-min, linear from 0", () => {
    expect(scoreTakeHome(5000, 10000, 15000, 25)).toBeCloseTo(6.25, 5);
    expect(scoreTakeHome(10000, 10000, 15000, 25)).toBeCloseTo(12.5, 5);
  });

  it("scores half-to-full weight between target-min and target-ideal", () => {
    expect(scoreTakeHome(11500, 10000, 15000, 25)).toBeCloseTo(16.25, 5);
    expect(scoreTakeHome(15000, 10000, 15000, 25)).toBeCloseTo(25, 5);
  });

  it("clamps at full weight above target-ideal", () => {
    expect(scoreTakeHome(20000, 10000, 15000, 25)).toBe(25);
  });
});

describe("scoreSemiAbsenteeFit", () => {
  it("scores full weight when a GM/lead operator is confirmed", () => {
    expect(scoreSemiAbsenteeFit(true, null, 15)).toBe(15);
  });

  it("scores a heavy 10% penalty when explicitly no GM/lead operator", () => {
    expect(scoreSemiAbsenteeFit(false, null, 15)).toBeCloseTo(1.5, 5);
  });

  it("infers from owner hours when GM status is unknown", () => {
    expect(scoreSemiAbsenteeFit(null, 10, 15)).toBeCloseTo(15, 5);
    expect(scoreSemiAbsenteeFit(null, 40, 15)).toBeCloseTo(1.5, 5);
    expect(scoreSemiAbsenteeFit(null, 25, 15)).toBeCloseTo(8.25, 5);
  });

  it("falls back to a neutral 40% when both GM status and hours are unknown", () => {
    expect(scoreSemiAbsenteeFit(null, null, 15)).toBeCloseTo(6, 5);
  });
});

describe("scoreStaffDepth", () => {
  it("scores 0 at 0 employees, full weight at 8+", () => {
    expect(scoreStaffDepth(0, 10)).toBe(0);
    expect(scoreStaffDepth(8, 10)).toBe(10);
    expect(scoreStaffDepth(16, 10)).toBe(10);
  });

  it("treats unknown employee count as 0 (conservative)", () => {
    expect(scoreStaffDepth(null, 10)).toBe(0);
  });

  it("scores linearly between 0 and 8 employees", () => {
    expect(scoreStaffDepth(4, 10)).toBeCloseTo(5, 5);
    expect(scoreStaffDepth(5, 10)).toBeCloseTo(6.25, 5);
  });
});

describe("classifyLeaseStabilityPct", () => {
  it("treats unknown lease status as neutral", () => {
    expect(classifyLeaseStabilityPct(null)).toBe(0.5);
    expect(classifyLeaseStabilityPct("Negotiating new terms")).toBe(0.5);
  });

  it("classifies month-to-month as poor", () => {
    expect(classifyLeaseStabilityPct("Month-to-month, 30 day notice")).toBe(0.2);
    expect(classifyLeaseStabilityPct("MTM")).toBe(0.2);
  });

  it("classifies ownership/home-based/long-term as favorable", () => {
    expect(classifyLeaseStabilityPct("Owns building outright")).toBe(1.0);
    expect(classifyLeaseStabilityPct("Home-based business, no lease")).toBe(1.0);
    expect(classifyLeaseStabilityPct("Long-term lease, transferable")).toBe(1.0);
  });

  it("classifies short-term as middling", () => {
    expect(classifyLeaseStabilityPct("Short-term lease (1 year)")).toBe(0.5);
  });
});

describe("scoreLeaseStability", () => {
  it("scales weight by the classified lease stability percentage", () => {
    expect(scoreLeaseStability("Month-to-month", 10)).toBeCloseTo(2, 5);
    expect(scoreLeaseStability("Owns the building", 10)).toBe(10);
    expect(scoreLeaseStability(null, 10)).toBe(5);
  });
});

describe("scoreIndustryQuality", () => {
  it("scores full weight on a case-insensitive preferred-industry match", () => {
    expect(scoreIndustryQuality("Plumbing", ["Plumbing", "HVAC"], 5)).toBe(5);
    expect(scoreIndustryQuality("PLUMBING", ["plumbing"], 5)).toBe(5);
  });

  it("scores half weight on no match or unknown industry", () => {
    expect(scoreIndustryQuality("Retail", ["Plumbing"], 5)).toBeCloseTo(2.5, 5);
    expect(scoreIndustryQuality(null, ["Plumbing"], 5)).toBeCloseTo(2.5, 5);
  });
});

describe("scoreValuationMultiple", () => {
  it("scores 0 when SDE multiple is non-computable", () => {
    expect(scoreValuationMultiple(null, 5)).toBe(0);
  });

  it("scores full weight at or below 2.5x, 0 at or above 4.5x", () => {
    expect(scoreValuationMultiple(2.5, 5)).toBe(5);
    expect(scoreValuationMultiple(2.0, 5)).toBe(5);
    expect(scoreValuationMultiple(4.5, 5)).toBe(0);
    expect(scoreValuationMultiple(5.0, 5)).toBe(0);
  });

  it("scores linearly between 2.5x and 4.5x", () => {
    expect(scoreValuationMultiple(3.5, 5)).toBeCloseTo(2.5, 5);
    expect(scoreValuationMultiple(3.0, 5)).toBeCloseTo(3.75, 5);
  });
});

describe("scoreRedFlags", () => {
  it("scores full weight at 0 flags, scaling to 0 at 3+ flags", () => {
    expect(scoreRedFlags(0, 5)).toBe(5);
    expect(scoreRedFlags(1, 5)).toBeCloseTo(3.33333, 4);
    expect(scoreRedFlags(3, 5)).toBe(0);
    expect(scoreRedFlags(5, 5)).toBe(0);
  });
});

// Shared fixture for detectRedFlags / applyHardRejectRules / scoreListing tests below.
const STRONG_FIXTURE: ScoringInput = {
  dscr: 1.6,
  baseMonthlyTakeHome: 16000,
  conservativeMonthlyTakeHome: 12000,
  hasGmOrLeadOperator: true,
  ownerHoursPerWeek: 5,
  employeeCount: 10,
  leaseStatus: "Long-term lease, transferable",
  industry: "Home Services",
  preferredIndustries: ["Home Services"],
  sdeMultiple: 2.5,
  rawSde: 300000,
  sdeVerified: true,
  annualRevenue: 900000,
  reasonForSale: "Retirement",
  yearsInBusiness: 10,
  ffeValue: 50000,
  askingPrice: 900000,
  targetTakeHomeMin: 10000,
  targetTakeHomeIdeal: 15000,
  weights: WEIGHTS,
};

describe("detectRedFlags", () => {
  it("finds no flags on a clean strong listing", () => {
    expect(detectRedFlags(STRONG_FIXTURE)).toEqual([]);
  });

  it("flags missing SDE distinctly from unverified SDE", () => {
    expect(detectRedFlags({ ...STRONG_FIXTURE, rawSde: 0 })).toContain("Missing SDE");
    expect(detectRedFlags({ ...STRONG_FIXTURE, rawSde: null })).toContain("Missing SDE");
    expect(detectRedFlags({ ...STRONG_FIXTURE, sdeVerified: false })).toContain("Unverified SDE");
  });

  it("flags no employees, no GM, high SDE multiple, low DSCR, month-to-month lease", () => {
    expect(detectRedFlags({ ...STRONG_FIXTURE, employeeCount: 0 })).toContain("No employees");
    expect(detectRedFlags({ ...STRONG_FIXTURE, hasGmOrLeadOperator: false })).toContain("No GM or lead operator");
    expect(detectRedFlags({ ...STRONG_FIXTURE, sdeMultiple: 4.5 })).toContain("SDE multiple above 4x");
    expect(detectRedFlags({ ...STRONG_FIXTURE, dscr: 1.1 })).toContain("DSCR below 1.25x");
    expect(detectRedFlags({ ...STRONG_FIXTURE, leaseStatus: "Month-to-month" })).toContain("Month-to-month lease");
  });

  it("flags undisclosed reason for sale, short tenure, and FF&E concentration", () => {
    expect(detectRedFlags({ ...STRONG_FIXTURE, reasonForSale: null })).toContain("Undisclosed reason for sale");
    expect(detectRedFlags({ ...STRONG_FIXTURE, yearsInBusiness: 1 })).toContain("Less than 2 years in business");
    expect(detectRedFlags({ ...STRONG_FIXTURE, ffeValue: 400000 })).toContain("FF&E exceeds 40% of asking price");
  });
});

describe("applyHardRejectRules", () => {
  it("does not trigger on a clean strong listing", () => {
    const result = applyHardRejectRules(STRONG_FIXTURE);
    expect(result.triggered).toBe(false);
    expect(result.cap).toBeNull();
    expect(result.reasons).toEqual([]);
  });

  it("triggers a severe cap (40) on DSCR below 1.0x", () => {
    const result = applyHardRejectRules({ ...STRONG_FIXTURE, dscr: 0.9 });
    expect(result.triggered).toBe(true);
    expect(result.cap).toBe(40);
    expect(result.reasons.some((r) => r.includes("DSCR below 1.0x"))).toBe(true);
  });

  it("triggers a severe cap (40) on conservative take-home below $5,000/month", () => {
    const result = applyHardRejectRules({ ...STRONG_FIXTURE, conservativeMonthlyTakeHome: 4000 });
    expect(result.cap).toBe(40);
  });

  it("triggers a severe cap (40) on SDE multiple above 5x", () => {
    const result = applyHardRejectRules({ ...STRONG_FIXTURE, sdeMultiple: 5.5 });
    expect(result.cap).toBe(40);
  });

  it("triggers a severe cap (40) when owner is required full-time with no GM", () => {
    const result = applyHardRejectRules({ ...STRONG_FIXTURE, hasGmOrLeadOperator: false, ownerHoursPerWeek: 45 });
    expect(result.cap).toBe(40);
    const resultUnknownHours = applyHardRejectRules({ ...STRONG_FIXTURE, hasGmOrLeadOperator: false, ownerHoursPerWeek: null });
    expect(resultUnknownHours.cap).toBe(40);
  });

  it("does not require full-time owner when hours are below 40", () => {
    const result = applyHardRejectRules({ ...STRONG_FIXTURE, hasGmOrLeadOperator: false, ownerHoursPerWeek: 20 });
    expect(result.reasons.some((r) => r.includes("fails semi-absentee"))).toBe(false);
  });

  it("triggers a moderate cap (64) on a poor lease alone", () => {
    const result = applyHardRejectRules({ ...STRONG_FIXTURE, leaseStatus: "Month-to-month" });
    expect(result.triggered).toBe(true);
    expect(result.cap).toBe(64);
  });

  it("triggers a moderate cap (64) on no staff + no GM", () => {
    const result = applyHardRejectRules({ ...STRONG_FIXTURE, employeeCount: 0, hasGmOrLeadOperator: null });
    expect(result.cap).toBe(64);
  });

  it("triggers a moderate cap (64) on missing/unverifiable financials", () => {
    expect(applyHardRejectRules({ ...STRONG_FIXTURE, rawSde: 0 }).cap).toBe(64);
    expect(applyHardRejectRules({ ...STRONG_FIXTURE, sdeVerified: false, annualRevenue: 0 }).cap).toBe(64);
  });

  it("does not flag weak financials when SDE is unverified but revenue is known", () => {
    const result = applyHardRejectRules({ ...STRONG_FIXTURE, sdeVerified: false });
    expect(result.reasons.some((r) => r.includes("Missing or unverifiable"))).toBe(false);
  });

  it("triggers a moderate cap (64) when FF&E exceeds 50% of asking price", () => {
    const result = applyHardRejectRules({ ...STRONG_FIXTURE, ffeValue: 500000 });
    expect(result.cap).toBe(64);
  });

  it("prefers the severe cap over moderate when both kinds of conditions are present", () => {
    const result = applyHardRejectRules({ ...STRONG_FIXTURE, dscr: 0.9, leaseStatus: "Month-to-month" });
    expect(result.cap).toBe(40);
    expect(result.reasons.length).toBe(2);
  });
});

describe("scoreListing", () => {
  it("scores a clean, high-quality listing as STRONG_CANDIDATE at the top of the scale", () => {
    const result = scoreListing(STRONG_FIXTURE);
    expect(result.rawWeightedTotal).toBeCloseTo(100, 5);
    expect(result.finalScore).toBeCloseTo(100, 5);
    expect(result.hardRejectTriggered).toBe(false);
    expect(result.label).toBe("STRONG_CANDIDATE");
  });

  it("scores a mixed-quality listing as MAYBE in the 65-79 band", () => {
    const borderline: ScoringInput = {
      ...STRONG_FIXTURE,
      dscr: 1.3,
      baseMonthlyTakeHome: 11500,
      conservativeMonthlyTakeHome: 8500,
      hasGmOrLeadOperator: null,
      ownerHoursPerWeek: 15,
      employeeCount: 5,
      industry: "Retail",
      sdeMultiple: 3.0,
    };
    const result = scoreListing(borderline);
    expect(result.rawWeightedTotal).toBeCloseTo(71.5, 5);
    expect(result.finalScore).toBeCloseTo(71.5, 5);
    expect(result.hardRejectTriggered).toBe(false);
    expect(result.label).toBe("MAYBE");
  });

  it("caps a high raw score down to a forced PASS when a moderate hard-reject rule fires", () => {
    const weakLease: ScoringInput = { ...STRONG_FIXTURE, leaseStatus: "Month-to-month, no long-term security" };
    const result = scoreListing(weakLease);
    expect(result.rawWeightedTotal).toBeGreaterThan(64);
    expect(result.hardRejectTriggered).toBe(true);
    expect(result.finalScore).toBe(64);
    expect(result.label).toBe("PASS");
  });

  it("caps a high raw score down to a forced PASS when a severe hard-reject rule fires", () => {
    const badDscr: ScoringInput = { ...STRONG_FIXTURE, dscr: 0.9 };
    const result = scoreListing(badDscr);
    expect(result.rawWeightedTotal).toBeGreaterThan(40);
    expect(result.hardRejectTriggered).toBe(true);
    expect(result.finalScore).toBe(40);
    expect(result.label).toBe("PASS");
  });

  it("scores a weak, red-flag-heavy listing as PASS even without a hard reject", () => {
    const weak: ScoringInput = {
      dscr: 1.3,
      baseMonthlyTakeHome: 6000,
      conservativeMonthlyTakeHome: 5500,
      hasGmOrLeadOperator: null,
      ownerHoursPerWeek: null,
      employeeCount: 2,
      leaseStatus: "Short-term lease",
      industry: "Restaurant",
      preferredIndustries: ["Home Services"],
      sdeMultiple: 4.2,
      rawSde: 150000,
      sdeVerified: false,
      annualRevenue: 500000,
      reasonForSale: null,
      yearsInBusiness: 1,
      ffeValue: 100000,
      askingPrice: 600000,
      targetTakeHomeMin: 10000,
      targetTakeHomeIdeal: 15000,
      weights: WEIGHTS,
    };
    const result = scoreListing(weak);
    expect(result.label).toBe("PASS");
    expect(result.redFlags.length).toBeGreaterThan(0);
  });
});
