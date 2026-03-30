// ─── Reusable: LoadMoreButton ─────────────────────────────────────────────────

interface LoadMoreButtonProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  disabled?: boolean;
}

export function LoadMoreButton({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  disabled = false,
}: LoadMoreButtonProps) {
  // Hide button when there's no next page
  if (!hasNextPage) {
    return null;
  }

  return (
    <button
      onClick={onLoadMore}
      disabled={isFetchingNextPage || disabled}
      aria-label="Load more results"
      className="w-full rounded-[6px] hover:cursor-pointer hover:bg-[#001323] py-3.5 text-sm font-semibold text-white transition-all bg-[#d4431f] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#E84D2A]/40 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {isFetchingNextPage ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Loading...
        </span>
      ) : (
        "Load More"
      )}
    </button>
  );
}
