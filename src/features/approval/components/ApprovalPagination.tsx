import { ChevronLeft, ChevronRight } from "lucide-react";

/** Fixed page size for the approval list. */
export const APPROVAL_PAGE_SIZE = 12;

/** Maximum number of page buttons shown before collapsing with ellipses. */
const MAX_VISIBLE_PAGES = 7;

type PageItem = number | "ellipsis-start" | "ellipsis-end";

export interface ApprovalPaginationProps {
  /** Currently requested page (1-based). */
  page: number;
  /** Total number of matching approval requests. */
  total: number;
  /** Fixed number of rows requested per page. Defaults to {@link APPROVAL_PAGE_SIZE}. */
  pageSize?: number;
  /** Called with the next 1-based page number. */
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Builds the list of page buttons, collapsing long ranges around the current
 * page with ellipses. Exported for unit testing.
 */
export function getPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: PageItem[] = [1];

  // Keep one page of context on either side of the current page.
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    items.push("ellipsis-start");
  }

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  if (end < totalPages - 1) {
    items.push("ellipsis-end");
  }

  items.push(totalPages);

  return items;
}

const baseButtonClasses =
  "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-lg border px-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40";

/**
 * Pagination controls for the approval list: previous/next buttons and
 * numbered page links. Renders nothing when everything fits on one page.
 */
export function ApprovalPagination({
  page,
  total,
  pageSize = APPROVAL_PAGE_SIZE,
  onPageChange,
  className = "",
}: ApprovalPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  if (totalPages <= 1) {
    return null;
  }

  const pageItems = getPageItems(currentPage, totalPages);

  return (
    <nav
      aria-label="Approval list pagination"
      data-testid="approval-pagination"
      className={`flex flex-wrap items-center justify-center gap-2 ${className}`.trim()}
    >
      <button
        type="button"
        aria-label="Previous page"
        data-testid="pagination-prev"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={`${baseButtonClasses} border-gray-200 bg-white text-gray-600 hover:bg-gray-50`}
      >
        <ChevronLeft size={16} aria-hidden="true" />
        <span className="hidden sm:inline">Prev</span>
      </button>

      {pageItems.map((item) =>
        typeof item === "number" ? (
          <button
            key={item}
            type="button"
            aria-label={`Page ${item}`}
            aria-current={item === currentPage ? "page" : undefined}
            data-testid={`pagination-page-${item}`}
            onClick={() => {
              if (item !== currentPage) {
                onPageChange(item);
              }
            }}
            className={[
              baseButtonClasses,
              item === currentPage
                ? "border-orange-600 bg-orange-600 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
            ].join(" ")}
          >
            {item}
          </button>
        ) : (
          <span
            key={item}
            aria-hidden="true"
            className="inline-flex h-9 w-9 items-center justify-center text-sm text-gray-400"
          >
            &hellip;
          </span>
        ),
      )}

      <button
        type="button"
        aria-label="Next page"
        data-testid="pagination-next"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={`${baseButtonClasses} border-gray-200 bg-white text-gray-600 hover:bg-gray-50`}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}
