import React from 'react';

export interface PaginationProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}) => {
  if (!hasNextPage) {
    return null;
  }

  return (
    <div className="flex justify-center w-full py-6">
      <button
        onClick={onLoadMore}
        disabled={isFetchingNextPage}
        aria-label="Load more results"
        className="flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        {isFetchingNextPage ? (
          <>
            <svg
              className="w-4 h-4 mr-2 text-white animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              data-testid="pagination-spinner"
            >
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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : (
          'Load more'
        )}
      </button>
    </div>
  );
};
