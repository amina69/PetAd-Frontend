import { Pagination } from "../../../components/ui/Pagination";

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

/**
 * Pagination controls for the approval list.
 *
 * Delegates rendering to the shared `Pagination` primitive so every list in
 * the app uses the same ellipsis, `aria-current` and keyboard behaviour.
 * `total`/`pageSize` stay in the API because callers work with totals.
 */
export function ApprovalPagination({
  page,
  total,
  pageSize = APPROVAL_PAGE_SIZE,
  onPageChange,
  className = "",
}: ApprovalPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));

  return (
    <Pagination
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
      ariaLabel="Approval list pagination"
      data-testid="approval-pagination"
      className={className}
    />
  );
}
