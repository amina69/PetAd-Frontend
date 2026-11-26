import { useState } from "react";
import { Link } from "react-router-dom";
import { useSavedSearches, type SavedSearch } from "../hooks/useSavedSearches";

function getSearchUrl(search: SavedSearch): string {
  const params = new URLSearchParams();
  const { location, category, radius, latitude, longitude } = search.params;
  if (location) params.set("location", location);
  if (category && category !== "all") params.set("category", category);
  if (radius) params.set("radius", String(radius));
  if (latitude !== undefined && longitude !== undefined) {
    params.set("latitude", latitude.toFixed(2));
    params.set("longitude", longitude.toFixed(2));
  }
  const query = params.toString();
  return query ? `/home?${query}` : "/home";
}

export function SavedSearchesPage() {
  const { savedSearches, rename, remove } = useSavedSearches();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Saved searches</h1>
      <p className="mb-6 text-sm text-gray-600">Run, rename, or remove your saved pet filters.</p>
      {savedSearches.length === 0 ? (
        <p className="rounded-xl bg-gray-50 p-6 text-gray-600">
          No saved searches yet. Choose filters on the home page and save a search.
        </p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200">
          {savedSearches.map((search) => (
            <li key={search.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                {editingId === search.id ? (
                  <form
                    className="flex gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (rename(search.id, name)) setEditingId(null);
                    }}
                  >
                    <label className="sr-only" htmlFor={`rename-${search.id}`}>Search name</label>
                    <input
                      id={`rename-${search.id}`}
                      autoFocus
                      maxLength={60}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="min-w-0 rounded-lg border border-gray-300 px-3 py-2"
                    />
                    <button className="rounded-lg bg-[#0D162B] px-3 py-2 text-sm font-semibold text-white">Save</button>
                    <button type="button" onClick={() => setEditingId(null)} className="rounded-lg border px-3 py-2 text-sm">Cancel</button>
                  </form>
                ) : (
                  <>
                    <p className="truncate font-semibold text-gray-900">{search.name}</p>
                    <p className="text-sm text-gray-500">
                      {[search.params.location, search.params.category !== "all" ? search.params.category : null]
                        .filter(Boolean)
                        .join(" · ") || "All pets"}
                    </p>
                  </>
                )}
              </div>
              {editingId !== search.id && (
                <div className="flex items-center gap-2">
                  <Link to={getSearchUrl(search)} className="rounded-lg bg-[#0D162B] px-3 py-2 text-sm font-semibold text-white">
                    Run
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setName(search.name);
                      setEditingId(search.id);
                    }}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(search.id)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-red-700"
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
