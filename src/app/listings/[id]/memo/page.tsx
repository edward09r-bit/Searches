import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { generateMemo } from "@/lib/actions/memo-actions";
import { MemoView } from "@/components/memo/MemoView";

// Next.js 16: `params` is a Promise with no synchronous-access fallback.
export default async function MemoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      evaluations: {
        where: { isCurrent: true },
        include: { scoreResult: true, memo: true },
        take: 1,
      },
    },
  });

  if (!listing) notFound();

  const evaluation = listing.evaluations[0] ?? null;
  const memo = evaluation?.memo ?? null;

  const boundGenerateMemo = generateMemo.bind(null, listing.id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href={`/listings/${listing.id}`} className="text-sm text-zinc-500 hover:underline">
        ← Back to listing
      </Link>

      <div className="mt-2 flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">{listing.businessName} — Memo</h1>
        {evaluation ? (
          <form action={boundGenerateMemo}>
            <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
              {memo ? "Regenerate memo" : "Generate memo"}
            </button>
          </form>
        ) : null}
      </div>

      {!evaluation && (
        <p className="mt-6 text-sm text-zinc-400">
          No evaluation has been run for this listing yet.{" "}
          <Link href={`/listings/${listing.id}`} className="underline">
            Run one first.
          </Link>
        </p>
      )}

      {evaluation && !memo && (
        <p className="mt-6 text-sm text-zinc-400">No memo has been generated for the current evaluation yet.</p>
      )}

      {memo && (
        <div className="mt-8">
          <MemoView memo={memo} />
        </div>
      )}
    </div>
  );
}
