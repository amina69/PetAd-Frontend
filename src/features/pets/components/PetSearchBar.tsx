import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { petService } from "../../../api/petService";
import { STALE_TIME } from "../../../lib/staleTime";
import { queryKeys } from "../../../lib/queryKeys";
import type { Pet } from "../../../types/pet";

/** Fewer characters than this never trigger a request. */
const MIN_QUERY_LENGTH = 2;

/**
 * PetSearchBar - A search bar for finding pets
 *
 * Features:
 * - 300ms debounce on user input
 * - Minimum 2 characters required before issuing a search
 * - Escape key clears the query and resets to page 1
 * - Resets page to 1 on new query
 * - Ignores stale in-flight requests via query key handling
 */
export interface PetSearchBarProps {
  /** Optional initial query value */
  initialQuery?: string;
  /** Called when pets are fetched */
  onPetsFetch: (pets: Pet[]) => void;
  /** Called when search state changes */
  onSearchChange: (query: string, page: number) => void;
}

/**
 * PetSearchBar - A search bar for finding pets
 */
export function PetSearchBar({ initialQuery = "", onPetsFetch, onSearchChange }: PetSearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const isSearchable = debouncedQuery.length >= MIN_QUERY_LENGTH;
  const reportedQuery = useRef(debouncedQuery);

  // The query key contains the debounced term, so a new search starts a new
  // cache entry and results from a superseded term are never shown.
  const { data, isFetching } = useQuery<Pet[]>({
    queryKey: queryKeys.pets.search(debouncedQuery),
    queryFn: () => petService.searchPets(debouncedQuery),
    enabled: isSearchable,
    staleTime: STALE_TIME.PETS,
  });

  // Notify the parent once per settled query, resetting it to page 1.
  useEffect(() => {
    if (reportedQuery.current === debouncedQuery) return;
    reportedQuery.current = debouncedQuery;
    onSearchChange(debouncedQuery, 1);
  }, [debouncedQuery, onSearchChange]);

  useEffect(() => {
    if (data) onPetsFetch(data);
  }, [data, onPetsFetch]);

  // Handle clear (Escape key or clear button)
  const handleClear = () => {
    setQuery("");
    reportedQuery.current = "";
    onSearchChange("", 1); // Reset to page 1 on clear
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder="Search pets..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            handleClear();
          }
        }}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        aria-label="Search pets"
      />

      {/* Clear button appears when there's input */}
      {query.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}

      {/* Results section */}
      {isSearchable && isFetching && <p className="mt-2 text-sm text-gray-500">Searching...</p>}

      {isSearchable && !isFetching && data && data.length > 0 && (
        <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
          {data.map((pet) => (
            <li key={pet.id} className="flex items-center px-2 py-1 text-sm hover:bg-gray-100 rounded">
              <span className="font-medium">{pet.name}</span>
              <span className="ml-2 text-gray-400">{pet.breed}</span>
            </li>
          ))}
        </ul>
      )}

      {isSearchable && !isFetching && data && data.length === 0 && (
        <p className="mt-2 text-sm text-gray-500">No pets found</p>
      )}
    </div>
  );
}
