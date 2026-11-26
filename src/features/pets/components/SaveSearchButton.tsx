import { useState } from "react";
import { BookmarkPlus } from "lucide-react";
import {
  SAVED_SEARCH_LIMIT,
  useSavedSearches,
  type SavedSearchParams,
} from "../hooks/useSavedSearches";

interface SaveSearchButtonProps {
  params: SavedSearchParams;
}

export function SaveSearchButton({ params }: SaveSearchButtonProps) {
  const { atLimit, save } = useSavedSearches();
  const [isNaming, setIsNaming] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const handleSave = () => {
    const result = save(name, params);
    if (result === "saved") {
      setName("");
      setIsNaming(false);
      setMessage("Search saved.");
    } else if (result === "limit") {
      setMessage(`You can save up to ${SAVED_SEARCH_LIMIT} searches. Delete one to save another.`);
    } else {
      setMessage("Enter a name of 1–60 characters.");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isNaming ? (
        <>
          <label className="sr-only" htmlFor="saved-search-name">
            Saved search name
          </label>
          <input
            id="saved-search-name"
            autoFocus
            maxLength={60}
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSave();
            }}
            placeholder="Name this search"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button type="button" onClick={handleSave} className="rounded-lg bg-[#0D162B] px-3 py-2 text-sm font-semibold text-white">
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setIsNaming(false);
              setMessage("");
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          type="button"
          disabled={atLimit}
          onClick={() => {
            setMessage("");
            setIsNaming(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <BookmarkPlus aria-hidden="true" size={16} />
          Save search
        </button>
      )}
      {message && <p role="status" aria-live="polite" className="text-sm text-gray-600">{message}</p>}
      {atLimit && !message && (
        <p role="status" className="text-sm text-amber-700">
          You can save up to 10 searches. Delete one to save another.
        </p>
      )}
    </div>
  );
}
