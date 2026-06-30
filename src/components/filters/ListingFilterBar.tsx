import Link from "next/link";
import type { ListingFilters } from "@/lib/filters";

const inputClass = "mt-1 block w-full rounded-md border border-zinc-300 px-2 py-1 text-sm";
const labelClass = "block text-xs font-medium text-zinc-600";

const STATUS_OPTIONS = ["NEW", "REVIEWING", "WATCHLIST", "PASSED", "CLOSED", "STALE"];

// Plain GET form — filters live in the URL (shareable/bookmarkable), no
// client-side state needed.
export function ListingFilterBar({ filters }: { filters: ListingFilters }) {
  return (
    <form method="get" className="mb-6 grid grid-cols-2 gap-3 rounded-md border border-zinc-200 p-4 sm:grid-cols-4">
      <div>
        <label className={labelClass} htmlFor="state">State</label>
        <input id="state" name="state" defaultValue={filters.state ?? ""} placeholder="CA" className={inputClass} />
      </div>

      <div>
        <label className={labelClass} htmlFor="industry">Industry contains</label>
        <input id="industry" name="industry" defaultValue={filters.industry ?? ""} className={inputClass} />
      </div>

      <div>
        <label className={labelClass} htmlFor="status">Status</label>
        <select id="status" name="status" defaultValue={filters.status ?? ""} className={inputClass}>
          <option value="">Any</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="franchise">Franchise</label>
        <select id="franchise" name="franchise" defaultValue={filters.franchise ?? ""} className={inputClass}>
          <option value="">Any</option>
          <option value="franchise">Franchise</option>
          <option value="independent">Independent</option>
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="semiAbsentee">GM / lead operator</label>
        <select id="semiAbsentee" name="semiAbsentee" defaultValue={filters.semiAbsentee ?? ""} className={inputClass}>
          <option value="">Any</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="minScore">Min score</label>
        <input id="minScore" name="minScore" type="number" defaultValue={filters.minScore ?? ""} className={inputClass} />
      </div>

      <div>
        <label className={labelClass} htmlFor="maxScore">Max score</label>
        <input id="maxScore" name="maxScore" type="number" defaultValue={filters.maxScore ?? ""} className={inputClass} />
      </div>

      <div>
        <label className={labelClass} htmlFor="minDscr">Min DSCR</label>
        <input id="minDscr" name="minDscr" type="number" step="0.1" defaultValue={filters.minDscr ?? ""} className={inputClass} />
      </div>

      <div>
        <label className={labelClass} htmlFor="minPrice">Min price</label>
        <input id="minPrice" name="minPrice" type="number" defaultValue={filters.minPrice ?? ""} className={inputClass} />
      </div>

      <div>
        <label className={labelClass} htmlFor="maxPrice">Max price</label>
        <input id="maxPrice" name="maxPrice" type="number" defaultValue={filters.maxPrice ?? ""} className={inputClass} />
      </div>

      <div>
        <label className={labelClass} htmlFor="minTakeHome">Min take-home (mo.)</label>
        <input id="minTakeHome" name="minTakeHome" type="number" defaultValue={filters.minTakeHome ?? ""} className={inputClass} />
      </div>

      <div>
        <label className={labelClass} htmlFor="maxTakeHome">Max take-home (mo.)</label>
        <input id="maxTakeHome" name="maxTakeHome" type="number" defaultValue={filters.maxTakeHome ?? ""} className={inputClass} />
      </div>

      <div className="col-span-2 flex items-end gap-2 sm:col-span-4">
        <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
          Apply filters
        </button>
        <Link href="/listings" className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium">
          Clear
        </Link>
      </div>
    </form>
  );
}
