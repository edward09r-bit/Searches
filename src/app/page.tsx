import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-bold">Acquisition Intelligence</h1>
      <p className="max-w-md text-zinc-500">
        Paste or enter a business-for-sale listing to get a conservative, financially-grounded
        screening memo.
      </p>
      <div className="flex gap-3">
        <Link href="/listings/new" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
          New listing
        </Link>
        <Link href="/listings" className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium">
          View listings
        </Link>
      </div>
    </div>
  );
}
