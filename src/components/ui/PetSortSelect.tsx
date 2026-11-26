import type { PetSortOption } from "../../types/petList";

export interface PetSortSelectProps {
  value: PetSortOption;
  onChange: (sort: PetSortOption) => void;
  /** Total number of pets after filters are applied. */
  resultCount: number;
  /** Whether the user has supplied a location (enables the "Nearest" option). */
  hasLocation: boolean;
}

const SORT_OPTIONS: Array<{ value: PetSortOption; label: string }> = [
  { value: "newest", label: "Newest first" },
  { value: "nearest", label: "Nearest" },
  { value: "youngest", label: "Youngest first" },
  { value: "oldest", label: "Oldest first" },
];

/**
 * PetSortSelect — sort control + live result count for the listings page.
 *
 * - "Nearest" is disabled when no location is provided.
 * - The result count announces itself with aria-live="polite" so screen-reader
 *   users are informed after each filter/sort change without stealing focus.
 * - The default sort ("newest") is never written to the URL; callers should
 *   omit the `sort` query param when the value equals the default.
 */
export function PetSortSelect({ value, onChange, resultCount, hasLocation }: PetSortSelectProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Result count — announced after results change without stealing focus */}
      <p
        aria-live="polite"
        aria-atomic="true"
        className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap"
      >
        <span className="font-semibold text-gray-900 dark:text-gray-100">{resultCount}</span>{" "}
        {resultCount === 1 ? "pet" : "pets"}
      </p>

      {/* Sort select */}
      <label className="sr-only" htmlFor="pet-sort-select">
        Sort pets by
      </label>
      <select
        id="pet-sort-select"
        value={value}
        onChange={(e) => onChange(e.target.value as PetSortOption)}
        className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 px-3 py-2.5 outline-none focus:border-[#E84D2A] focus:ring-1 focus:ring-[#E84D2A] transition-colors"
      >
        {SORT_OPTIONS.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            disabled={opt.value === "nearest" && !hasLocation}
          >
            {opt.label}
            {opt.value === "nearest" && !hasLocation ? " (enable location first)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
