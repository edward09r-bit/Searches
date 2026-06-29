"use server";

import { redirect } from "next/navigation";
import { prisma } from "../prisma";
import {
  buildFinancialOverviewTable,
  buildCashFlowModelTable,
  buildSbaAssumptionsTable,
  buildTaxEstimateTable,
  buildOwnerPayStructureTable,
  buildScenarioComparisonTable,
  buildFinalVerdict,
  buildFallbackNarrative,
} from "../memo";
import { generateMemoNarrativeWithFallback } from "../memo-narrative";

// All numeric/table sections are deterministic. The narrative is an LLM call
// grounded strictly in already-computed fields, with a deterministic fallback
// so memo generation never hard-fails on the narrative step alone. Keyed by
// evaluationId since each append-only Evaluation gets its own Memo.
export async function generateMemo(listingId: string) {
  const listing = await prisma.listing.findUniqueOrThrow({
    where: { id: listingId },
    include: {
      evaluations: {
        where: { isCurrent: true },
        include: { scoreResult: true },
        take: 1,
      },
    },
  });

  const evaluation = listing.evaluations[0];
  const scoreResult = evaluation?.scoreResult;

  if (!evaluation || !scoreResult) {
    throw new Error("Run an evaluation before generating a memo.");
  }

  const fallbackNarrative = buildFallbackNarrative(listing, scoreResult);
  const narrative = await generateMemoNarrativeWithFallback(listing, evaluation, scoreResult, fallbackNarrative);

  await prisma.memo.upsert({
    where: { evaluationId: evaluation.id },
    create: {
      listingId,
      evaluationId: evaluation.id,
      financialOverviewTable: buildFinancialOverviewTable(listing, evaluation),
      cashFlowModelTable: buildCashFlowModelTable(evaluation),
      sbaAssumptionsTable: buildSbaAssumptionsTable(evaluation),
      taxEstimateTable: buildTaxEstimateTable(evaluation),
      ownerPayStructureTable: buildOwnerPayStructureTable(evaluation),
      scenarioComparisonTable: buildScenarioComparisonTable(evaluation),
      businessOverview: narrative.businessOverview,
      fitNarrative: narrative.fitNarrative,
      redFlagsNarrative: narrative.redFlagsNarrative,
      finalVerdict: buildFinalVerdict(evaluation, scoreResult),
    },
    update: {
      financialOverviewTable: buildFinancialOverviewTable(listing, evaluation),
      cashFlowModelTable: buildCashFlowModelTable(evaluation),
      sbaAssumptionsTable: buildSbaAssumptionsTable(evaluation),
      taxEstimateTable: buildTaxEstimateTable(evaluation),
      ownerPayStructureTable: buildOwnerPayStructureTable(evaluation),
      scenarioComparisonTable: buildScenarioComparisonTable(evaluation),
      businessOverview: narrative.businessOverview,
      fitNarrative: narrative.fitNarrative,
      redFlagsNarrative: narrative.redFlagsNarrative,
      finalVerdict: buildFinalVerdict(evaluation, scoreResult),
    },
  });

  redirect(`/listings/${listingId}/memo`);
}
