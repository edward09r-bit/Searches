"use server";

import { redirect } from "next/navigation";
import { prisma } from "../prisma";
import { getSettings, settingsToScoringWeights } from "../settings";
import { runFullEvaluation } from "../finance";
import { scoreListing, type ScoringInput } from "../scoring";

// Runs the financial model + scorer for a listing and persists the result as
// the new current Evaluation/ScoreResult pair (append-only: the previous
// current Evaluation, if any, flips isCurrent=false rather than being
// overwritten, so memos stay traceable to the numbers that produced them).
export async function runEvaluation(listingId: string) {
  const listing = await prisma.listing.findUniqueOrThrow({ where: { id: listingId } });
  const settings = await getSettings();

  if (!listing.askingPrice || listing.askingPrice <= 0) {
    throw new Error("Listing is missing an asking price — cannot model SBA debt service without it.");
  }

  const [federalBrackets, caBrackets] = await Promise.all([
    prisma.taxBracket.findMany({
      where: { jurisdiction: "FEDERAL", filingStatus: settings.filingStatus, taxYear: settings.taxYear },
      orderBy: { bracketOrder: "asc" },
    }),
    prisma.taxBracket.findMany({
      where: { jurisdiction: "CA", filingStatus: settings.filingStatus, taxYear: settings.taxYear },
      orderBy: { bracketOrder: "asc" },
    }),
  ]);

  if (federalBrackets.length === 0 || caBrackets.length === 0) {
    throw new Error(`No tax brackets seeded for filingStatus="${settings.filingStatus}", taxYear=${settings.taxYear}.`);
  }

  const askingPrice = listing.askingPrice;
  const annualRevenue = listing.annualRevenue ?? 0;
  const rawSde = listing.annualSde ?? 0;

  const result = runFullEvaluation({
    askingPrice,
    annualRevenue,
    rawSde,
    sdeVerified: listing.sdeVerified,
    sdeHaircutPct: settings.unverifiedSdeHaircutPct,
    ownerAnnualSalary: settings.ownerSalaryDefault,
    sbaRatePct: settings.sbaRatePct,
    sbaTermMonths: settings.sbaTermMonths,
    sbaDownPaymentPct: settings.sbaDownPaymentPct,
    stacksOnOtherIncome: settings.stacksOnOtherIncome,
    otherOrdinaryIncome: settings.otherOrdinaryIncome,
    federalBrackets,
    caBrackets,
  });

  const scoringInput: ScoringInput = {
    dscr: result.base.dscr,
    baseMonthlyTakeHome: result.base.monthlyTakeHome,
    conservativeMonthlyTakeHome: result.conservative.monthlyTakeHome,
    hasGmOrLeadOperator: listing.hasGmOrLeadOperator,
    ownerHoursPerWeek: listing.ownerHoursPerWeek,
    employeeCount: listing.employeeCount,
    leaseStatus: listing.leaseStatus,
    industry: listing.industry,
    preferredIndustries: settings.preferredIndustries,
    sdeMultiple: result.sdeMultiple,
    rawSde: listing.annualSde,
    sdeVerified: listing.sdeVerified,
    annualRevenue: listing.annualRevenue,
    reasonForSale: listing.reasonForSale,
    yearsInBusiness: listing.yearsInBusiness,
    ffeValue: listing.ffeValue,
    askingPrice,
    targetTakeHomeMin: settings.targetTakeHomeMin,
    targetTakeHomeIdeal: settings.targetTakeHomeIdeal,
    weights: settingsToScoringWeights(settings),
  };

  const scoreOutput = scoreListing(scoringInput);

  const inputsSnapshot = {
    listing: {
      askingPrice,
      annualRevenue: listing.annualRevenue,
      rawSde: listing.annualSde,
      sdeVerified: listing.sdeVerified,
      employeeCount: listing.employeeCount,
      hasGmOrLeadOperator: listing.hasGmOrLeadOperator,
      ownerHoursPerWeek: listing.ownerHoursPerWeek,
      leaseStatus: listing.leaseStatus,
      industry: listing.industry,
      reasonForSale: listing.reasonForSale,
      yearsInBusiness: listing.yearsInBusiness,
      ffeValue: listing.ffeValue,
    },
    settings: {
      filingStatus: settings.filingStatus,
      taxYear: settings.taxYear,
      stacksOnOtherIncome: settings.stacksOnOtherIncome,
      otherOrdinaryIncome: settings.otherOrdinaryIncome,
      sdeHaircutPct: settings.unverifiedSdeHaircutPct,
      ownerAnnualSalary: settings.ownerSalaryDefault,
      sbaRatePct: settings.sbaRatePct,
      sbaTermMonths: settings.sbaTermMonths,
      sbaDownPaymentPct: settings.sbaDownPaymentPct,
      targetTakeHomeMin: settings.targetTakeHomeMin,
      targetTakeHomeIdeal: settings.targetTakeHomeIdeal,
      preferredIndustries: settings.preferredIndustries,
      weights: settingsToScoringWeights(settings),
    },
  };

  await prisma.$transaction(async (tx) => {
    await tx.evaluation.updateMany({ where: { listingId, isCurrent: true }, data: { isCurrent: false } });

    const evaluation = await tx.evaluation.create({
      data: {
        listingId,
        isCurrent: true,
        inputsSnapshot,

        revenueMultiple: result.revenueMultiple,
        sdeMultiple: result.sdeMultiple,

        rawSde,
        sdeHaircutPct: settings.unverifiedSdeHaircutPct,
        conservativeSde: result.base.scenarioSde,

        monthlyOperatingProfit: result.base.monthlyOperatingProfit,
        monthlyOpexEstimate: result.monthlyOpexEstimate,

        sbaLoanAmount: result.base.sbaLoanAmount,
        sbaRatePct: settings.sbaRatePct,
        sbaTermMonths: settings.sbaTermMonths,
        sbaMonthlyPayment: result.base.sbaMonthlyPayment,
        sbaAnnualDebtService: result.base.sbaAnnualDebtService,
        dscr: result.base.dscr,

        ownerAnnualSalary: settings.ownerSalaryDefault,
        monthlyOwnerSalary: result.base.monthlyOwnerSalary,
        monthlyEstimatedDistributions: result.base.monthlyEstimatedDistributions,
        distributionsNegativeFlag: result.base.distributionsNegativeFlag,

        filingStatus: settings.filingStatus,
        stacksOnOtherIncome: settings.stacksOnOtherIncome,
        otherOrdinaryIncome: settings.otherOrdinaryIncome,

        federalTaxAnnual: result.base.federalTaxAnnual,
        caTaxAnnual: result.base.caTaxAnnual,
        ficaAnnual: result.base.ficaAnnual,

        baseAnnualTakeHome: result.base.annualTakeHome,
        baseMonthlyTakeHome: result.base.monthlyTakeHome,
        conservativeAnnualTakeHome: result.conservative.annualTakeHome,
        conservativeMonthlyTakeHome: result.conservative.monthlyTakeHome,
        upsideAnnualTakeHome: result.upside.annualTakeHome,
        upsideMonthlyTakeHome: result.upside.monthlyTakeHome,
      },
    });

    await tx.scoreResult.create({
      data: {
        evaluationId: evaluation.id,
        dscrScore: scoreOutput.dscrScore,
        takeHomeScore: scoreOutput.takeHomeScore,
        semiAbsenteeScore: scoreOutput.semiAbsenteeScore,
        staffDepthScore: scoreOutput.staffDepthScore,
        leaseStabilityScore: scoreOutput.leaseStabilityScore,
        industryQualityScore: scoreOutput.industryQualityScore,
        valuationMultipleScore: scoreOutput.valuationMultipleScore,
        redFlagsScore: scoreOutput.redFlagsScore,
        rawWeightedTotal: scoreOutput.rawWeightedTotal,
        finalScore: scoreOutput.finalScore,
        label: scoreOutput.label,
        hardRejectTriggered: scoreOutput.hardRejectTriggered,
        hardRejectReasons: scoreOutput.hardRejectReasons,
        redFlags: scoreOutput.redFlags,
      },
    });
  });

  redirect(`/listings/${listingId}`);
}
