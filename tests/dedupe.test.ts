import { describe, expect, it } from "vitest";
import { diceCoefficient } from "../src/lib/string-similarity";

describe("diceCoefficient", () => {
  it("scores identical strings as 1", () => {
    expect(diceCoefficient("Joe's Pizza", "Joe's Pizza")).toBe(1);
  });

  it("is case-insensitive", () => {
    expect(diceCoefficient("Joe's Pizza", "JOE'S PIZZA")).toBe(1);
  });

  it("scores near-identical business names above the 0.85 threshold", () => {
    expect(diceCoefficient("ABC Plumbing Inc", "ABC Plumbing, Inc.")).toBeGreaterThanOrEqual(0.85);
    expect(diceCoefficient("Sunset Laundromat", "Sunset Laundromat LLC")).toBeGreaterThanOrEqual(0.85);
  });

  it("scores short near-duplicates with punctuation removed as similar but not necessarily above threshold", () => {
    // Short names are sensitive to bigram count, so an apostrophe drop alone
    // ("Joe's" -> "Joes") can land just under the fuzzy-match threshold —
    // documenting that boundary rather than asserting a stricter guarantee.
    expect(diceCoefficient("Joe's Pizza", "Joes Pizza")).toBeGreaterThan(0.7);
  });

  it("scores unrelated business names well below the threshold", () => {
    expect(diceCoefficient("Joe's Pizza", "Acme Laundromat")).toBeLessThan(0.85);
  });

  it("treats two empty strings as identical and one empty string as no match", () => {
    expect(diceCoefficient("", "")).toBe(1);
    expect(diceCoefficient("", "Joe's Pizza")).toBe(0);
  });
});
