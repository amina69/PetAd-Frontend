import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import type { LocationRadius } from "../components/LocationInput";

export const SAVED_SEARCH_LIMIT = 10;
export const SAVED_SEARCHES_STORAGE_KEY = "petad:saved-searches";
const SAVED_SEARCHES_CHANGED_EVENT = "petad:saved-searches-changed";

const filterFieldSchemas = {
  location: z.string().trim().min(1).max(120),
  category: z.enum(["all", "dog", "cat", "bird"]),
  radius: z.union([z.literal(5), z.literal(10), z.literal(25), z.literal(50)]),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
};

export interface SavedSearchParams {
  location?: string;
  category?: "all" | "dog" | "cat" | "bird";
  radius?: LocationRadius;
  latitude?: number;
  longitude?: number;
}

export interface SavedSearch {
  id: string;
  name: string;
  params: SavedSearchParams;
  createdAt: number;
}

function sanitizeParams(value: unknown): SavedSearchParams {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const input = value as Record<string, unknown>;
  const params: SavedSearchParams = {};

  for (const [key, schema] of Object.entries(filterFieldSchemas)) {
    const parsed = schema.safeParse(input[key]);
    if (parsed.success) {
      Object.assign(params, { [key]: parsed.data });
    }
  }

  if (params.latitude === undefined || params.longitude === undefined) {
    delete params.latitude;
    delete params.longitude;
  }

  return params;
}

export function parseSavedSearches(raw: string | null): SavedSearch[] {
  if (!raw) return [];

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry): SavedSearch[] => {
    if (!entry || typeof entry !== "object") return [];
    const metadata = z
      .object({
        id: z.string().min(1),
        name: z.string().trim().min(1).max(60),
        createdAt: z.number().finite(),
      })
      .safeParse(entry);
    if (!metadata.success) return [];

    return [{
      ...metadata.data,
      params: sanitizeParams((entry as Record<string, unknown>).params),
    }];
  }).slice(0, SAVED_SEARCH_LIMIT);
}

function readSavedSearches(): SavedSearch[] {
  return parseSavedSearches(window.localStorage.getItem(SAVED_SEARCHES_STORAGE_KEY));
}

function writeSavedSearches(searches: SavedSearch[]) {
  window.localStorage.setItem(SAVED_SEARCHES_STORAGE_KEY, JSON.stringify(searches));
  window.dispatchEvent(new Event(SAVED_SEARCHES_CHANGED_EVENT));
}

export function useSavedSearches() {
  const [savedSearches, setSavedSearches] = useState(readSavedSearches);

  useEffect(() => {
    const refresh = () => setSavedSearches(readSavedSearches());
    window.addEventListener(SAVED_SEARCHES_CHANGED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(SAVED_SEARCHES_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const save = useCallback((name: string, params: SavedSearchParams) => {
    const normalizedName = name.trim();
    const nameResult = z.string().min(1).max(60).safeParse(normalizedName);
    if (!nameResult.success) return "invalid" as const;

    const current = readSavedSearches();
    if (current.length >= SAVED_SEARCH_LIMIT) {
      setSavedSearches(current);
      return "limit" as const;
    }

    const next = [
      ...current,
      {
        id: crypto.randomUUID(),
        name: normalizedName,
        params: sanitizeParams(params),
        createdAt: Date.now(),
      },
    ];
    writeSavedSearches(next);
    setSavedSearches(next);
    return "saved" as const;
  }, []);

  const rename = useCallback((id: string, name: string) => {
    const normalizedName = name.trim();
    if (!z.string().min(1).max(60).safeParse(normalizedName).success) return false;
    const next = readSavedSearches().map((search) =>
      search.id === id ? { ...search, name: normalizedName } : search,
    );
    writeSavedSearches(next);
    setSavedSearches(next);
    return true;
  }, []);

  const remove = useCallback((id: string) => {
    const next = readSavedSearches().filter((search) => search.id !== id);
    writeSavedSearches(next);
    setSavedSearches(next);
  }, []);

  return {
    savedSearches,
    save,
    rename,
    remove,
    atLimit: savedSearches.length >= SAVED_SEARCH_LIMIT,
  };
}
