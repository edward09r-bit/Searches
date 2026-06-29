const TIERS = [
  { min: 80, className: "bg-green-100 text-green-800" },
  { min: 65, className: "bg-yellow-100 text-yellow-800" },
  { min: -Infinity, className: "bg-red-100 text-red-800" },
];

export function ScoreBadge({ score }: { score: number }) {
  const tier = TIERS.find((t) => score >= t.min)!;
  return <span className={`rounded-full px-3 py-1 text-sm font-bold ${tier.className}`}>{Math.round(score)}</span>;
}
