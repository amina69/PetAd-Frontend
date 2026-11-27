import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { petService } from "../api/petService";
import { queryKeys } from "../lib/queryKeys";

const RECENTLY_VIEWED_STORAGE_KEY = "petad:recently-viewed-pets";
const MAX_RECENTLY_VIEWED_PETS = 10;

function normalizePetId(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function limitAndDeduplicate(ids: string[]): string[] {
  return [...new Set(ids)].slice(0, MAX_RECENTLY_VIEWED_PETS);
}

function readRecentlyViewedPetIds(): string[] {
  try {
    const stored = window.localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return limitAndDeduplicate(
      parsed
        .map(normalizePetId)
        .filter((id): id is string => id !== null),
    );
  } catch {
    return [];
  }
}

function writeRecentlyViewedPetIds(ids: string[]): void {
  try {
    window.localStorage.setItem(
      RECENTLY_VIEWED_STORAGE_KEY,
      JSON.stringify(ids),
    );
  } catch {
    // Keep browsing usable when browser storage is disabled or full.
  }
}

export function recordRecentlyViewedPet(id: string): void {
  const petId = normalizePetId(id);
  if (!petId) return;

  const ids = limitAndDeduplicate([
    petId,
    ...readRecentlyViewedPetIds().filter((storedId) => storedId !== petId),
  ]);
  writeRecentlyViewedPetIds(ids);
}

export function useRecentlyViewed() {
  const [recentlyViewedIds, setRecentlyViewedIds] = useState(
    readRecentlyViewedPetIds,
  );
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.pets.list(),
    queryFn: petService.getPets,
    enabled: recentlyViewedIds.length > 0,
    staleTime: 0,
  });

  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewedIds([]);
    try {
      window.localStorage.removeItem(RECENTLY_VIEWED_STORAGE_KEY);
    } catch {
      // Keep browsing usable when browser storage is disabled.
    }
  }, []);

  const pets = (data ?? [])
    .filter(
      (pet) =>
        recentlyViewedIds.includes(String(pet.id)) &&
        pet.status.trim().toLowerCase() !== "adopted",
    )
    .sort(
      (first, second) =>
        recentlyViewedIds.indexOf(String(first.id)) -
        recentlyViewedIds.indexOf(String(second.id)),
    );

  return {
    recentlyViewedIds,
    pets,
    isLoading: recentlyViewedIds.length > 0 && isLoading,
    isError,
    clearRecentlyViewed,
  };
}
