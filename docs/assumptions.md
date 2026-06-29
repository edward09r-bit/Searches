# Assumptions and Defaults

This is a plain-English mirror of every default baked into the app so they can be
audited and corrected without reading code. Every number here lives in the
`Settings` table or `TaxBracket` table (or, for FICA, as named constants in
`src/lib/tax.ts`) — never hardcoded inside calculation logic.

## Buyer profile defaults (`Settings`)

- **Filing status: Single.** Federal + CA brackets are seeded for single filers
  only. If this is wrong, change `Settings.filingStatus` and seed the
  corresponding bracket rows in `TaxBracket`.
- **Income stacking: Standalone (`stacksOnOtherIncome = false`).** The
  acquisition's income is modeled as if it starts at $0 in the tax brackets,
  not stacked on top of other earned income. Flip this toggle and set
  `otherOrdinaryIncome` if the acquisition's income should instead be taxed at
  the marginal rate on top of existing income.
- **Target take-home: $10,000/mo minimum, $15,000/mo ideal.**
- **Semi-absentee preference: on.**
- **SBA terms: 9.75% rate, 120-month term, 10% down payment.**
- **SDE conservatism: $85,000 assumed owner salary, 12% haircut on unverified SDE.**
- **Scoring weights (sum to 100): DSCR 25, take-home 25, semi-absentee fit 15,
  staff depth 10, lease stability 10, industry quality 5, valuation multiple 5,
  red flags 5.**

All of the above are editable in the Settings UI without a code change.

## Entity tax model: S-corp election (hardcoded modeling assumption, not a Settings toggle)

The $85k owner salary is modeled as W-2 wages (employee-side FICA only — Social
Security + Medicare on that portion). Remaining profit is modeled as
distributions taxed as ordinary income with **no self-employment tax**. This
matches an S-corp election, the standard reason buyers split pay into "salary"
+ "distributions" in the first place.

**If the actual acquisition vehicle will be a sole proprietorship or
single-member LLC instead, take-home drops materially** — the full 15.3%
self-employment tax applies to all profit, not just FICA on the salary
portion. This is not a Settings toggle in this version; treat every take-home
number in every memo as S-corp-shaped unless you've separately confirmed the
deal will actually use that entity structure.

## Federal income tax — 2025, single filer

Verified 2026-06-29 against IRS.gov / Tax Foundation. Seeded in `TaxBracket`
(`jurisdiction = "FEDERAL"`).

| Rate | Income range |
|---|---|
| 10% | $0 – $11,925 |
| 12% | $11,925 – $48,475 |
| 22% | $48,475 – $103,350 |
| 24% | $103,350 – $197,300 |
| 32% | $197,300 – $250,525 |
| 35% | $250,525 – $626,350 |
| 37% | $626,350+ |

**Standard deduction: $15,750.** Note: the original plan assumed $15,000 (the
pre-legislation 2025 figure). The One Big Beautiful Bill Act, signed
2025-07-04, raised it to $15,750 — the seeded value reflects the actual
in-effect 2025 figure, not the original plan draft.

## California income tax — 2025, single filer

Verified 2026-06-29 against official FTB sources. Seeded in `TaxBracket`
(`jurisdiction = "CA"`).

| Rate | Income range |
|---|---|
| 1% | $0 – $11,079 |
| 2% | $11,079 – $26,264 |
| 4% | $26,264 – $41,452 |
| 6% | $41,452 – $57,542 |
| 8% | $57,542 – $72,724 |
| 9.3% | $72,724 – $371,479 |
| 10.3% | $371,479 – $445,771 |
| 11.3% | $445,771 – $742,953 |
| 12.3% | $742,953 – $1,000,000 |
| 13.3% | $1,000,000+ |

The top row (13.3%) is the 12.3% top marginal rate plus California's 1%
Behavioral Health Services Tax (formerly the Mental Health Services Tax),
which applies to all taxable income above a **fixed $1,000,000 threshold that
is not inflation-adjusted**. It's modeled here as its own bracket row rather
than a separate surcharge field, since marginal-bracket math produces the same
result either way.

**Standard deduction: $5,706.** The original plan flagged this as
"~$5,540, needs verification" — the confirmed, official 2025 figure is $5,706.

## FICA (payroll tax on the owner's W-2 salary portion only)

Hardcoded as named constants in `src/lib/tax.ts` (not seeded data — FICA is a
flat-rate-plus-cap structure, simple enough that a yearly code update is
reasonable, unlike the federal/CA bracket tables):

- Social Security: 6.2%, capped at the 2025 wage base of **$176,100**.
- Medicare: 1.45%, uncapped.
- Additional Medicare Tax: +0.9% on wages above $200,000 (single-filer
  threshold) — irrelevant at the $85k default salary, included for
  correctness if the salary assumption is raised.

These rates apply only to the salary portion under the S-corp assumption
above; distributions carry no FICA or self-employment tax in this model.

## Database: SQLite, not Postgres

The app uses SQLite (`prisma/dev.db`, a single local file) instead of
Postgres so it runs with zero external setup — no Docker, no database
server to install or keep running. This is a deliberate simplicity tradeoff
for a single-user, personal-use app; if this is ever extended to a hosted,
multi-user deployment, swap `datasource db { provider }` back to
`"postgresql"` (or another server-based engine) and point `DATABASE_URL` at
a real server — SQLite doesn't handle concurrent writers well, which matters
for hosting but not for one person evaluating listings locally.

One schema consequence: `Settings.preferredIndustries` is stored as a JSON
column (`Json`) rather than a native string list, since SQLite has no scalar
list type. `getSettings()` in `src/lib/settings.ts` parses it back into a
`string[]` so the rest of the app never deals with the raw JSON.

## Known sandbox-specific limitation (does not affect the user's own machine)

In the development sandbox this app was built in, the Prisma CLI's binary
pre-flight check (`schema-engine` download, triggered by `generate`, `migrate`,
`db`, `init`, `validate`, `-v`, etc.) fails with a TLS/connection reset
specific to that sandbox's network setup. The real `prisma/schema.prisma` and
`prisma/seed.ts` are correct and will work normally with the standard
`npx prisma migrate dev` / `npx prisma db seed` / `npx prisma generate` flow on
a normal machine. No migration is committed to the repo — the `start.sh` /
`start.command` / `start.bat` scripts run `prisma migrate dev --name init` on
first launch, which generates and applies the correct SQLite migration using
the user's own working Prisma CLI, sidestepping the sandbox-only binary
download issue entirely.
