import { useState, useEffect } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useQuery } from "@tanstack/react-query";
import { petService } from "@/api/petService";
import type { Pet } from "@/types/pet";

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
  const { debouncedValue, rawValue, onChange, clear } = useDebouncedValue(query);

  // Use react-query with a query key that includes the query and page
  // This ensures that when the query changes, a new query is triggered
  // and stale in-flight requests from previous queries are ignored
  const { data, isLoading, isFetching, refetch } = useQuery<Pet[], Error>(
    ["pets", "search", debouncedValue, 1],
    async () => {
      // Minimum 2 characters check
      if (debouncedValue.length < 2) {
        return [];
      }
      return petService.searchPets(debouncedValue);
    },
    {
      enabled: debouncedValue.length >= 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Update query when debounced value changes (with 300ms delay)
  useEffect(() => {
    if (debouncedValue !== query) {
      setQuery(debouncedValue);
      onSearchChange?.(debouncedValue, 1); // Reset page to 1 on new query
    }
  }, [debouncedValue, query, onSearchChange]);

  // Handle input changes from the debounced hook
  const handleInputChange = (value: string) => {
    setQuery(value);
    onChange(value);
  };

  // Handle clear (Escape key)
  const handleClear = () => {
    clear();
    setQuery("");
    onSearchChange?.("", 1); // Reset to page 1 on clear
  };

  return (
    <div className="relative w-full">
      <div className="absolute inset-0 pointer-events-none">
        {/* Search icon or placeholder styling */}
      </div>

      <input
        type="text"
        placeholder="Search pets..."
        value={rawValue}
        onChange={(e) => handleInputChange(e.target.value)}
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
      {rawValue.length > 0 && (
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
      {debouncedValue.length >= 2 && isFetching && (
        <p className="mt-2 text-sm text-gray-500">Searching...</p>
      )}

      {debouncedValue.length >= 2 && data && data.length > 0 && (
        <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
          {data.map((pet) => (
            <li key={pet.id} className="flex items-center px-2 py-1 text-sm hover:bg-gray-100 rounded">
              <span className="font-medium">{pet.name}</span>
              <span className="ml-2 text-gray-400">{pet.breed}</span>
            </li>
          ))}
        </ul>
      )}

      {debouncedValue.length >= 2 && !data && data?.length !== 0 && (
        <p className="mt-2 text-sm text-gray-500">No pets found</p>
      )}
    </div>
  );
}