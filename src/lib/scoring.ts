// Pure scoring engine. No DB access — Settings/weights and all evaluation
// numbers are passed in by the caller.

export type ScoringWeights = {
  dscr: number;
  takeHome: number;
  semiAbsentee: number;
  staffDepth: number;
  leaseStability: number;
  industryQuality: number;
  valuationMultiple: number;
  redFlags: number;
};

export type ScoringInput = {
  dscr: number;
  baseMonthlyTakeHome: number;
  conservativeMonthlyTakeHome: number;
  hasGmOrLeadOperator: boolean | null;
  ownerHoursPerWeek: number | null;
  employeeCount: number | null;
  leaseStatus: string | null;
  industry: string | null;
  preferredIndustries: string[];
  sdeMultiple: number | null;
  rawSde: number | null;
  sdeVerified: boolean;
  annualRevenue: number | null;
  reasonForSale: string | null;
  yearsInBusiness: number | null;
  ffeValue: number | null;
  askingPrice: number;
  targetTakeHomeMin: number;
  targetTakeHomeIdeal: number;
  weights: ScoringWeights;
};

export type ScoreLabel = "STRONG_CANDIDATE" | "MAYBE" | "PASS";

export type ScoreOutput = {
  dscrScore: number;
  takeHomeScore: number;
  semiAbsenteeScore: number;
  staffDepthScore: number;
  leaseStabilityScore: number;
  industryQualityScore: number;
  valuationMultipleScore: number;
  redFlagsScore: number;
  rawWeightedTotal: number;
  finalScore: number;
  label: ScoreLabel;
  hardRejectTriggered: boolean;
  hardRejectReasons: string[];
  redFlags: string[];
};

// Maps `value` linearly onto [fromScore, toScore] as it moves from
// `fromValue` to `toValue`, clamping outside that range — covers every
// "0 below X, full above Y, linear between" pattern in the spec.
function linearScale(value: number, fromValue: number, toValue: number, fromScore: number, toScore: number): number {
  if (fromValue === toValue) return toScore;
  const t = (value - fromValue) / (toValue - fromValue);
  const clampedT = Math.max(0, Math.min(1, t));
  return fromScore + clampedT * (toScore - fromScore);
}

export function scoreDscr(dscr: number, weight: number): number {
  return linearScale(dscr, 1.0, 1.5, 0, weight);
}

export function scoreTakeHome(monthlyTakeHome: number, targetMin: number, targetIdeal: number, weight: number): number {
  if (monthlyTakeHome <= 0) return 0;
  const halfWeight = weight / 2;
  if (monthlyTakeHome < targetMin) {
    return linearScale(monthlyTakeHome, 0, targetMin, 0, halfWeight);
  }
  return linearScale(monthlyTakeHome, targetMin, targetIdeal, halfWeight, weight);
}

// hasGmOrLeadOperator === null (unknown either way) falls back to a neutral
// 40% default rather than guessing from hours alone.
export function scoreSemiAbsenteeFit(hasGmOrLeadOperator: boolean | null, ownerHoursPerWeek: number | null, weight: number): number {
  if (hasGmOrLeadOperator === true) return weight;
  if (hasGmOrLeadOperator === false) return weight * 0.1;
  if (ownerHoursPerWeek !== null) {
    return linearScale(ownerHoursPerWeek, 10, 40, weight, weight * 0.1);
  }
  return weight * 0.4;
}

// Unknown employee count is treated as 0 — conservative by design, consistent
// with the app's overall stance of never giving credit for unverified upside.
export function scoreStaffDepth(employeeCount: number | null, weight: number): number {
  return linearScale(employeeCount ?? 0, 0, 8, 0, weight);
}

const LEASE_OWNERSHIP_KEYWORDS = ["owns", "owned", "no lease", "home-based", "home based"];
const LEASE_LONG_TERM_KEYWORDS = ["long-term", "long term", "transferable", "renewable"];
const LEASE_MONTH_TO_MONTH_KEYWORDS = ["month-to-month", "month to month", "mtm"];
const LEASE_SHORT_TERM_KEYWORDS = ["short-term", "short term"];

// Returns the fraction of full weight a given free-text lease description
// earns. Exported separately so detectRedFlags/applyHardRejectRules can
// reuse the same classification instead of re-implementing it.
export function classifyLeaseStabilityPct(leaseStatus: string | null): number {
  if (!leaseStatus) return 0.5;
  const lower = leaseStatus.toLowerCase();
  if (LEASE_MONTH_TO_MONTH_KEYWORDS.some((k) => lower.includes(k))) return 0.2;
  if (LEASE_OWNERSHIP_KEYWORDS.some((k) => lower.includes(k)) || LEASE_LONG_TERM_KEYWORDS.some((k) => lower.includes(k))) return 1.0;
  if (LEASE_SHORT_TERM_KEYWORDS.some((k) => lower.includes(k))) return 0.5;
  return 0.5;
}

export function scoreLeaseStability(leaseStatus: string | null, weight: number): number {
  return weight * classifyLeaseStabilityPct(leaseStatus);
}

export function scoreIndustryQuality(industry: string | null, preferredIndustries: string[], weight: number): number {
  const matches = industry !== null && preferredIndustries.some((p) => p.toLowerCase() === industry.toLowerCase());
  return matches ? weight : weight * 0.5;
}

// A non-computable multiple (SDE missing/zero) scores 0 rather than being
// excluded — already-penalized elsewhere via the "missing SDE" red flag, but
// shouldn't also earn free credit here.
export function scoreValuationMultiple(sdeMultiple: number | null, weight: number): number {
  if (sdeMultiple === null) return 0;
  return linearScale(sdeMultiple, 2.5, 4.5, weight, 0);
}

export function scoreRedFlags(redFlagCount: number, weight: number): number {
  return weight * Math.max(0, 1 - redFlagCount / 3);
}

export function detectRedFlags(input: ScoringInput): string[] {
  const flags: string[] = [];
  if (input.employeeCount === 0) flags.push("No employees");
  if (input.hasGmOrLeadOperator === false) flags.push("No GM or lead operator");
  if (!input.rawSde || input.rawSde <= 0) {
    flags.push("Missing SDE");
  } else if (!input.sdeVerified) {
    flags.push("Unverified SDE");
  }
  if (input.sdeMultiple !== null && input.sdeMultiple > 4) flags.push("SDE multiple above 4x");
  if (input.dscr < 1.25) flags.push("DSCR below 1.25x");
  if (classifyLeaseStabilityPct(input.leaseStatus) <= 0.2) flags.push("Month-to-month lease");
  if (!input.reasonForSale) flags.push("Undisclosed reason for sale");
  if (input.yearsInBusiness !== null && input.yearsInBusiness < 2) flags.push("Less than 2 years in business");
  if (input.ffeValue !== null && input.askingPrice > 0 && input.ffeValue / input.askingPrice > 0.4) {
    flags.push("FF&E exceeds 40% of asking price");
  }
  return flags;
}

const SEVERE_CAP = 40;
const MODERATE_CAP = 64;

function isNoStaffOwnerDependent(input: ScoringInput): boolean {
  return (input.employeeCount ?? 0) === 0 && input.hasGmOrLeadOperator !== true;
}

function isMissingOrWeakFinancials(input: ScoringInput): boolean {
  if (!input.rawSde || input.rawSde <= 0) return true;
  return !input.sdeVerified && (!input.annualRevenue || input.annualRevenue <= 0);
}

// hasGmOrLeadOperator===false combined with unknown-or-high owner hours is
// treated as a structural full-time-owner requirement, not just a soft
// semi-absentee penalty (which scoreSemiAbsenteeFit already applies).
function isFullTimeOwnerRequired(input: ScoringInput): boolean {
  return input.hasGmOrLeadOperator === false && (input.ownerHoursPerWeek === null || input.ownerHoursPerWeek >= 40);
}

function isFfeOverHalfPrice(input: ScoringInput): boolean {
  return input.ffeValue !== null && input.askingPrice > 0 && input.ffeValue / input.askingPrice > 0.5;
}

// The spec's "poor lease + location-dependent" condition is simplified to
// "poor lease" alone: a business with no physical lease to begin with
// (home-based/online) would already classify as favorable, not poor, so the
// location-dependent qualifier never changes the outcome in practice.
function isPoorLease(leaseStatus: string | null): boolean {
  return classifyLeaseStabilityPct(leaseStatus) <= 0.2;
}

export function applyHardRejectRules(input: ScoringInput): { triggered: boolean; reasons: string[]; cap: number | null } {
  const severeReasons: string[] = [];
  const moderateReasons: string[] = [];

  if (input.dscr < 1.0) severeReasons.push("DSCR below 1.0x — business cannot cover debt service");
  if (input.conservativeMonthlyTakeHome < 5000) severeReasons.push("Conservative-scenario take-home below $5,000/month");
  if (input.sdeMultiple !== null && input.sdeMultiple > 5) severeReasons.push("SDE multiple above 5x asking price");
  if (isFullTimeOwnerRequired(input)) severeReasons.push("No GM/lead operator and owner required full-time — fails semi-absentee requirement");

  if (isNoStaffOwnerDependent(input)) moderateReasons.push("No employees and no GM/lead operator");
  if (isMissingOrWeakFinancials(input)) moderateReasons.push("Missing or unverifiable core financials (SDE/revenue)");
  if (isPoorLease(input.leaseStatus)) moderateReasons.push("Month-to-month lease with no long-term security");
  if (isFfeOverHalfPrice(input)) moderateReasons.push("FF&E value exceeds 50% of asking price");

  const reasons = [...severeReasons, ...moderateReasons];
  if (severeReasons.length > 0) return { triggered: true, reasons, cap: SEVERE_CAP };
  if (moderateReasons.length > 0) return { triggered: true, reasons, cap: MODERATE_CAP };
  return { triggered: false, reasons: [], cap: null };
}

function labelForScore(score: number): ScoreLabel {
  if (score >= 80) return "STRONG_CANDIDATE";
  if (score >= 65) return "MAYBE";
  return "PASS";
}

export function scoreListing(input: ScoringInput): ScoreOutput {
  const redFlags = detectRedFlags(input);

  const dscrScore = scoreDscr(input.dscr, input.weights.dscr);
  const takeHomeScore = scoreTakeHome(input.baseMonthlyTakeHome, input.targetTakeHomeMin, input.targetTakeHomeIdeal, input.weights.takeHome);
  const semiAbsenteeScore = scoreSemiAbsenteeFit(input.hasGmOrLeadOperator, input.ownerHoursPerWeek, input.weights.semiAbsentee);
  const staffDepthScore = scoreStaffDepth(input.employeeCount, input.weights.staffDepth);
  const leaseStabilityScore = scoreLeaseStability(input.leaseStatus, input.weights.leaseStability);
  const industryQualityScore = scoreIndustryQuality(input.industry, input.preferredIndustries, input.weights.industryQuality);
  const valuationMultipleScore = scoreValuationMultiple(input.sdeMultiple, input.weights.valuationMultiple);
  const redFlagsScore = scoreRedFlags(redFlags.length, input.weights.redFlags);

  const rawWeightedTotal =
    dscrScore + takeHomeScore + semiAbsenteeScore + staffDepthScore + leaseStabilityScore + industryQualityScore + valuationMultipleScore + redFlagsScore;

  const { triggered, reasons, cap } = applyHardRejectRules(input);
  const finalScore = triggered && cap !== null ? Math.min(rawWeightedTotal, cap) : rawWeightedTotal;

  return {
    dscrScore,
    takeHomeScore,
    semiAbsenteeScore,
    staffDepthScore,
    leaseStabilityScore,
    industryQualityScore,
    valuationMultipleScore,
    redFlagsScore,
    rawWeightedTotal,
    finalScore,
    label: labelForScore(finalScore),
    hardRejectTriggered: triggered,
    hardRejectReasons: reasons,
    redFlags,
  };
}
