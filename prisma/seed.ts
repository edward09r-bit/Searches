import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Source: IRS Rev. Proc. 2024-40 brackets, with the single-filer standard
// deduction overridden by the One Big Beautiful Bill Act (signed 2025-07-04)
// to $15,750. Verified against IRS.gov / Tax Foundation, 2026-06-29.
const FEDERAL_2025_SINGLE = [
  { bracketOrder: 1, rate: 0.1, minIncome: 0, maxIncome: 11925 },
  { bracketOrder: 2, rate: 0.12, minIncome: 11925, maxIncome: 48475 },
  { bracketOrder: 3, rate: 0.22, minIncome: 48475, maxIncome: 103350 },
  { bracketOrder: 4, rate: 0.24, minIncome: 103350, maxIncome: 197300 },
  { bracketOrder: 5, rate: 0.32, minIncome: 197300, maxIncome: 250525 },
  { bracketOrder: 6, rate: 0.35, minIncome: 250525, maxIncome: 626350 },
  { bracketOrder: 7, rate: 0.37, minIncome: 626350, maxIncome: null },
];
const FEDERAL_2025_STANDARD_DEDUCTION = 15750;

// Source: 2025 FTB Form 540 tax rate schedules / tax table. The 1%
// Behavioral Health Services Tax (formerly Mental Health Services Tax)
// applies to all taxable income above a fixed, non-inflation-adjusted
// $1,000,000 threshold, modeled here as bracket 10 (12.3% + 1% = 13.3%).
// Verified against ftb.ca.gov sources, 2026-06-29.
const CA_2025_SINGLE = [
  { bracketOrder: 1, rate: 0.01, minIncome: 0, maxIncome: 11079 },
  { bracketOrder: 2, rate: 0.02, minIncome: 11079, maxIncome: 26264 },
  { bracketOrder: 3, rate: 0.04, minIncome: 26264, maxIncome: 41452 },
  { bracketOrder: 4, rate: 0.06, minIncome: 41452, maxIncome: 57542 },
  { bracketOrder: 5, rate: 0.08, minIncome: 57542, maxIncome: 72724 },
  { bracketOrder: 6, rate: 0.093, minIncome: 72724, maxIncome: 371479 },
  { bracketOrder: 7, rate: 0.103, minIncome: 371479, maxIncome: 445771 },
  { bracketOrder: 8, rate: 0.113, minIncome: 445771, maxIncome: 742953 },
  { bracketOrder: 9, rate: 0.123, minIncome: 742953, maxIncome: 1000000 },
  { bracketOrder: 10, rate: 0.133, minIncome: 1000000, maxIncome: null },
];
const CA_2025_STANDARD_DEDUCTION = 5706;

async function main() {
  await prisma.taxBracket.deleteMany({
    where: { taxYear: 2025, filingStatus: "single" },
  });

  await prisma.taxBracket.createMany({
    data: FEDERAL_2025_SINGLE.map((b) => ({
      jurisdiction: "FEDERAL",
      filingStatus: "single",
      taxYear: 2025,
      standardDeduction: FEDERAL_2025_STANDARD_DEDUCTION,
      ...b,
    })),
  });

  await prisma.taxBracket.createMany({
    data: CA_2025_SINGLE.map((b) => ({
      jurisdiction: "CA",
      filingStatus: "single",
      taxYear: 2025,
      standardDeduction: CA_2025_STANDARD_DEDUCTION,
      ...b,
    })),
  });

  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  console.log("Seed complete: 2025 federal + CA single-filer tax brackets, Settings singleton.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
