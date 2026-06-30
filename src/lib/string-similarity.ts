// Dice's coefficient over character bigrams — catches near-identical names
// ("ABC Plumbing Inc" vs "ABC Plumbing, Inc.") without an external dependency.
export function diceCoefficient(a: string, b: string): number {
  const bigrams = (s: string): string[] => {
    const norm = s.toLowerCase().trim().replace(/\s+/g, " ");
    const grams: string[] = [];
    for (let i = 0; i < norm.length - 1; i++) grams.push(norm.slice(i, i + 2));
    return grams;
  };

  const aGrams = bigrams(a);
  const bGrams = bigrams(b);
  if (aGrams.length === 0 || bGrams.length === 0) return aGrams.length === bGrams.length ? 1 : 0;

  const bGramCounts = new Map<string, number>();
  for (const g of bGrams) bGramCounts.set(g, (bGramCounts.get(g) ?? 0) + 1);

  let matches = 0;
  for (const g of aGrams) {
    const remaining = bGramCounts.get(g) ?? 0;
    if (remaining > 0) {
      matches++;
      bGramCounts.set(g, remaining - 1);
    }
  }

  return (2 * matches) / (aGrams.length + bGrams.length);
}
