import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PetCard, type Pet } from "../ui/PetCard";
import { FormSelect } from "../ui/formSelect";
import { MOCK_LISTINGS, CATEGORY_OPTIONS, type PetListingSectionProps } from "./petListingData";
import { LocationInput, type LocationRadius } from "../../features/pets/components/LocationInput";
import { SaveSearchButton } from "../../features/pets/components/SaveSearchButton";
import type { Coordinates } from "../../features/pets/hooks/useGeolocation";

const CATEGORIES = ["all", "dog", "cat", "bird"] as const;
const DEFAULT_RADIUS: LocationRadius = 10;

function isLocationRadius(value: number): value is LocationRadius {
  return value === 5 || value === 10 || value === 25 || value === 50;
}

function readCoordinates(params: URLSearchParams): Coordinates | null {
  const latitude = Number(params.get("latitude"));
  const longitude = Number(params.get("longitude"));
  if (!params.has("latitude") || !params.has("longitude")) return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude: Number(latitude.toFixed(2)), longitude: Number(longitude.toFixed(2)) };
}

export function PetListingSection({ onOwnerClick }: PetListingSectionProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pets, setPets] = useState<Pet[]>(MOCK_LISTINGS);
  const [locationFilter, setLocationFilter] = useState(() => searchParams.get("location") ?? "");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "dog" | "cat" | "bird">(() => {
    const category = searchParams.get("category");
    return CATEGORIES.find((value) => value === category) ?? "all";
  });
  const [radius, setRadius] = useState<LocationRadius>(() => {
    const value = Number(searchParams.get("radius"));
    return isLocationRadius(value) ? value : DEFAULT_RADIUS;
  });
  const [coordinates, setCoordinates] = useState(() => readCoordinates(searchParams));

  useEffect(() => {
    const next = new URLSearchParams();
    if (locationFilter.trim()) next.set("location", locationFilter.trim());
    if (categoryFilter !== "all") next.set("category", categoryFilter);
    if (radius !== DEFAULT_RADIUS) next.set("radius", String(radius));
    if (coordinates) {
      next.set("latitude", coordinates.latitude.toFixed(2));
      next.set("longitude", coordinates.longitude.toFixed(2));
    }
    setSearchParams(next, { replace: true });
  }, [categoryFilter, coordinates, locationFilter, radius, setSearchParams]);

  // Filter logic
  const filteredPets = useMemo(() => {
    return pets.filter((pet) => {
      const matchesCategory =
        categoryFilter === "all" || pet.category === categoryFilter;
      const matchesLocation =
        locationFilter === "" ||
        pet.location.toLowerCase().includes(locationFilter.toLowerCase());
      return matchesCategory && matchesLocation;
    });
  }, [pets, locationFilter, categoryFilter]);

  // Action Handlers
  const handleToggleFavourite = (id: string) => {
    setPets((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, isFavourite: !p.isFavourite } : p,
      ),
    );
  };

  const handleToggleInterested = (id: string) => {
    setPets((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, isInterested: !p.isInterested } : p,
      ),
    );
  };

  const handleResetFilters = () => {
    setLocationFilter("");
    setCategoryFilter("all");
    setRadius(DEFAULT_RADIUS);
    setCoordinates(null);
  };

  return (
    <section className="bg-white py-14 lg:py-20">
      <div className="max-w-[1240px] mx-auto px-6 lg:px-8">
        {/* ── Header & Filters ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h2 className="text-[22px] font-bold text-[#0D162B]">
            Available For Adoption ({filteredPets.length})
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <LocationInput
              location={locationFilter}
              radius={radius}
              onLocationChange={setLocationFilter}
              onRadiusChange={setRadius}
              onCoordinatesChange={setCoordinates}
            />

            {/* Category Filter */}
            <div className="w-[170px]">
              <FormSelect
                id="home-category-filter"
                label="Filter by category"
                options={CATEGORY_OPTIONS}
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(CATEGORIES.find((value) => value === e.target.value) ?? "all")
                }
                className="py-2.5!"
              />
            </div>

            {/* Reset Button */}
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium text-[14px] hover:bg-gray-50 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reset
            </button>
          </div>
        </div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <SaveSearchButton
            params={{
              location: locationFilter.trim() || undefined,
              category: categoryFilter,
              radius,
              latitude: coordinates?.latitude,
              longitude: coordinates?.longitude,
            }}
          />
          <Link to="/saved-searches" className="text-sm font-semibold text-[#0D162B] underline underline-offset-2">
            View saved searches
          </Link>
        </div>

        {/* ── Pet Card Grid ── */}
        {filteredPets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredPets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                onToggleFavourite={handleToggleFavourite}
                onToggleInterested={handleToggleInterested}
                onOwnerClick={onOwnerClick}
              />
            ))}
          </div>
        ) : (
          /* ── Empty State ── */
          <div className="flex flex-col items-center justify-center py-32 text-center bg-[#F9FAFB] rounded-2xl border border-gray-100">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
              <svg
                className="w-10 h-10 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No pets found
            </h3>
            <p className="text-gray-500 max-w-[300px]">
              No pets match your current filter criteria. Try adjusting the
              filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-6 text-[#E84D2A] font-medium hover:underline"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Footer here */}
    </section>
  );
}
