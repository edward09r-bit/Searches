-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('NEW', 'REVIEWING', 'WATCHLIST', 'PASSED', 'CLOSED', 'STALE');

-- CreateEnum
CREATE TYPE "ScoreLabel" AS ENUM ('STRONG_CANDIDATE', 'MAYBE', 'PASS');

-- CreateEnum
CREATE TYPE "SourceHistoryAction" AS ENUM ('EXTRACTED', 'RE_EXTRACTED', 'MANUAL_EDIT');

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceListingId" TEXT,
    "askingPrice" DOUBLE PRECISION,
    "annualRevenue" DOUBLE PRECISION,
    "annualSde" DOUBLE PRECISION,
    "annualEbitda" DOUBLE PRECISION,
    "sdeVerified" BOOLEAN NOT NULL DEFAULT false,
    "employeeCount" INTEGER,
    "locationCity" TEXT,
    "locationState" TEXT,
    "industry" TEXT,
    "subIndustry" TEXT,
    "leaseStatus" TEXT,
    "reasonForSale" TEXT,
    "yearsInBusiness" INTEGER,
    "ffeValue" DOUBLE PRECISION,
    "inventoryValue" DOUBLE PRECISION,
    "downPaymentStated" DOUBLE PRECISION,
    "financingAvailable" BOOLEAN,
    "sellerNetWorthRequirement" DOUBLE PRECISION,
    "sellerLiquidityRequirement" DOUBLE PRECISION,
    "isFranchise" BOOLEAN NOT NULL DEFAULT false,
    "franchiseName" TEXT,
    "hasGmOrLeadOperator" BOOLEAN,
    "ownerHoursPerWeek" INTEGER,
    "notes" TEXT,
    "rawPastedText" TEXT,
    "currentStatus" "ListingStatus" NOT NULL DEFAULT 'NEW',
    "dateFirstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateLastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "inputsSnapshot" JSONB NOT NULL,
    "revenueMultiple" DOUBLE PRECISION,
    "sdeMultiple" DOUBLE PRECISION,
    "rawSde" DOUBLE PRECISION NOT NULL,
    "sdeHaircutPct" DOUBLE PRECISION NOT NULL,
    "conservativeSde" DOUBLE PRECISION NOT NULL,
    "monthlyOperatingProfit" DOUBLE PRECISION NOT NULL,
    "monthlyOpexEstimate" DOUBLE PRECISION NOT NULL,
    "sbaLoanAmount" DOUBLE PRECISION NOT NULL,
    "sbaRatePct" DOUBLE PRECISION NOT NULL,
    "sbaTermMonths" INTEGER NOT NULL,
    "sbaMonthlyPayment" DOUBLE PRECISION NOT NULL,
    "sbaAnnualDebtService" DOUBLE PRECISION NOT NULL,
    "dscr" DOUBLE PRECISION NOT NULL,
    "ownerAnnualSalary" DOUBLE PRECISION NOT NULL,
    "monthlyOwnerSalary" DOUBLE PRECISION NOT NULL,
    "monthlyEstimatedDistributions" DOUBLE PRECISION NOT NULL,
    "distributionsNegativeFlag" BOOLEAN NOT NULL DEFAULT false,
    "filingStatus" TEXT NOT NULL,
    "stacksOnOtherIncome" BOOLEAN NOT NULL,
    "otherOrdinaryIncome" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "federalTaxAnnual" DOUBLE PRECISION NOT NULL,
    "caTaxAnnual" DOUBLE PRECISION NOT NULL,
    "ficaAnnual" DOUBLE PRECISION NOT NULL,
    "baseAnnualTakeHome" DOUBLE PRECISION NOT NULL,
    "baseMonthlyTakeHome" DOUBLE PRECISION NOT NULL,
    "conservativeAnnualTakeHome" DOUBLE PRECISION NOT NULL,
    "conservativeMonthlyTakeHome" DOUBLE PRECISION NOT NULL,
    "upsideAnnualTakeHome" DOUBLE PRECISION NOT NULL,
    "upsideMonthlyTakeHome" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreResult" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "dscrScore" DOUBLE PRECISION NOT NULL,
    "takeHomeScore" DOUBLE PRECISION NOT NULL,
    "semiAbsenteeScore" DOUBLE PRECISION NOT NULL,
    "staffDepthScore" DOUBLE PRECISION NOT NULL,
    "leaseStabilityScore" DOUBLE PRECISION NOT NULL,
    "industryQualityScore" DOUBLE PRECISION NOT NULL,
    "valuationMultipleScore" DOUBLE PRECISION NOT NULL,
    "redFlagsScore" DOUBLE PRECISION NOT NULL,
    "rawWeightedTotal" DOUBLE PRECISION NOT NULL,
    "finalScore" DOUBLE PRECISION NOT NULL,
    "label" "ScoreLabel" NOT NULL,
    "hardRejectTriggered" BOOLEAN NOT NULL DEFAULT false,
    "hardRejectReasons" JSONB NOT NULL,
    "redFlags" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Memo" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "financialOverviewTable" JSONB NOT NULL,
    "cashFlowModelTable" JSONB NOT NULL,
    "sbaAssumptionsTable" JSONB NOT NULL,
    "taxEstimateTable" JSONB NOT NULL,
    "ownerPayStructureTable" JSONB NOT NULL,
    "scenarioComparisonTable" JSONB NOT NULL,
    "businessOverview" TEXT NOT NULL,
    "fitNarrative" TEXT NOT NULL,
    "redFlagsNarrative" TEXT NOT NULL,
    "finalVerdict" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Memo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusHistoryEntry" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "fromStatus" "ListingStatus" NOT NULL,
    "toStatus" "ListingStatus" NOT NULL,
    "reason" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusHistoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchlistEntry" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WatchlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceHistoryEntry" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "action" "SourceHistoryAction" NOT NULL,
    "fieldDiffs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceHistoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "buyerState" TEXT NOT NULL DEFAULT 'CA',
    "targetTakeHomeMin" DOUBLE PRECISION NOT NULL DEFAULT 10000,
    "targetTakeHomeIdeal" DOUBLE PRECISION NOT NULL DEFAULT 15000,
    "semiAbsenteePreference" BOOLEAN NOT NULL DEFAULT true,
    "preferredIndustries" TEXT[],
    "filingStatus" TEXT NOT NULL DEFAULT 'single',
    "stacksOnOtherIncome" BOOLEAN NOT NULL DEFAULT false,
    "otherOrdinaryIncome" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxYear" INTEGER NOT NULL DEFAULT 2025,
    "sbaRatePct" DOUBLE PRECISION NOT NULL DEFAULT 9.75,
    "sbaTermMonths" INTEGER NOT NULL DEFAULT 120,
    "sbaDownPaymentPct" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "ownerSalaryDefault" DOUBLE PRECISION NOT NULL DEFAULT 85000,
    "unverifiedSdeHaircutPct" DOUBLE PRECISION NOT NULL DEFAULT 12,
    "weightDscr" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "weightTakeHome" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "weightSemiAbsentee" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "weightStaffDepth" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "weightLeaseStability" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "weightIndustryQuality" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "weightValuationMultiple" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "weightRedFlags" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxBracket" (
    "id" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "filingStatus" TEXT NOT NULL,
    "taxYear" INTEGER NOT NULL,
    "bracketOrder" INTEGER NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "minIncome" DOUBLE PRECISION NOT NULL,
    "maxIncome" DOUBLE PRECISION,
    "standardDeduction" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TaxBracket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Listing_source_sourceListingId_idx" ON "Listing"("source", "sourceListingId");

-- CreateIndex
CREATE INDEX "Listing_currentStatus_idx" ON "Listing"("currentStatus");

-- CreateIndex
CREATE INDEX "Listing_locationState_idx" ON "Listing"("locationState");

-- CreateIndex
CREATE INDEX "Evaluation_listingId_isCurrent_idx" ON "Evaluation"("listingId", "isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreResult_evaluationId_key" ON "ScoreResult"("evaluationId");

-- CreateIndex
CREATE UNIQUE INDEX "Memo_evaluationId_key" ON "Memo"("evaluationId");

-- CreateIndex
CREATE INDEX "Memo_listingId_idx" ON "Memo"("listingId");

-- CreateIndex
CREATE INDEX "Note_listingId_idx" ON "Note"("listingId");

-- CreateIndex
CREATE INDEX "StatusHistoryEntry_listingId_idx" ON "StatusHistoryEntry"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistEntry_listingId_key" ON "WatchlistEntry"("listingId");

-- CreateIndex
CREATE INDEX "SourceHistoryEntry_listingId_idx" ON "SourceHistoryEntry"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxBracket_jurisdiction_filingStatus_taxYear_bracketOrder_key" ON "TaxBracket"("jurisdiction", "filingStatus", "taxYear", "bracketOrder");

-- CreateIndex
CREATE INDEX "TaxBracket_jurisdiction_filingStatus_taxYear_idx" ON "TaxBracket"("jurisdiction", "filingStatus", "taxYear");

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreResult" ADD CONSTRAINT "ScoreResult_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memo" ADD CONSTRAINT "Memo_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memo" ADD CONSTRAINT "Memo_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistoryEntry" ADD CONSTRAINT "StatusHistoryEntry_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistEntry" ADD CONSTRAINT "WatchlistEntry_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceHistoryEntry" ADD CONSTRAINT "SourceHistoryEntry_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
