import { ChevronLeft, ChevronRight } from "lucide-react";

export type PageRangeItem = number | "ellipsis-start" | "ellipsis-end";

/**
 * Builds the page items rendered by `Pagination`.
 *
 * Short ranges render every page. Long ranges keep the first and last page,
 * `siblingCount` pages either side of the current page, and collapse the gaps
 * with ellipses. The result is always at most `siblingCount * 2 + 7` items,
 * which keeps the control a stable width at 7 or 1000 pages.
 */
export function getPageRange(
  currentPage: number,
  totalPages: number,
  siblingCount = 1,
): PageRangeItem[] {
  const total = Math.max(1, Math.floor(totalPages));
  const siblings = Math.max(0, Math.floor(siblingCount));
  const current = Math.min(Math.max(1, Math.floor(currentPage)), total);
  const range = (start: number, end: number) =>
    Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);

  // first + last + current + two siblings + two ellipses
  const totalSlots = siblings * 2 + 5;

  if (total <= totalSlots) {
    return range(1, total);
  }

  const leftSibling = Math.max(current - siblings, 1);
  const rightSibling = Math.min(current + siblings, total);
  const showLeftEllipsis = leftSibling > 3;
  const showRightEllipsis = rightSibling < total - 2;
  const edgePageCount = 3 + siblings * 2;

  if (!showLeftEllipsis) {
    return [...range(1, edgePageCount), "ellipsis-end", total];
  }

  if (!showRightEllipsis) {
    return [1, "ellipsis-start", ...range(total - edgePageCount + 1, total)];
  }

  return [
    1,
    "ellipsis-start",
    ...range(leftSibling, rightSibling),
    "ellipsis-end",
    total,
  ];
}

export interface PaginationProps {
  /** Current page, 1-based. Values outside the range are clamped. */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  ariaLabel?: string;
  siblingCount?: number;
  disabled?: boolean;
  className?: string;
  /** Render nothing when there is only one page. Defaults to true. */
  hideWhenSinglePage?: boolean;
  "data-testid"?: string;
}

const BUTTON_CLASSES =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40";

/**
 * Page-number pagination with ellipsis collapsing.
 *
 * The current page carries `aria-current="page"`; previous/next buttons are
 * disabled at the ends and every control is reachable by keyboard.
 */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  ariaLabel = "Pagination",
  siblingCount = 1,
  disabled = false,
  className,
  hideWhenSinglePage = true,
  "data-testid": dataTestId = "pagination",
}: PaginationProps) {
  const total = Math.max(1, Math.floor(totalPages));
  const current = Math.min(Math.max(1, Math.floor(page)), total);

  if (hideWhenSinglePage && total <= 1) {
    return null;
  }

  const items = getPageRange(current, total, siblingCount);

  return (
    <nav
      aria-label={ariaLabel}
      data-testid={dataTestId}
      className={[
        "flex flex-wrap items-center justify-center gap-2",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        aria-label="Previous page"
        data-testid="pagination-prev"
        disabled={disabled || current === 1}
        onClick={() => onPageChange(current - 1)}
        className={`${BUTTON_CLASSES} border-gray-200 bg-white text-gray-600 hover:bg-gray-50`}
      >
        <ChevronLeft className="rtl-mirror" size={16} aria-hidden="true" />
      </button>

      {items.map((item) =>
        typeof item === "number" ? (
          <button
            key={item}
            type="button"
            aria-label={`Page ${item}`}
            aria-current={item === current ? "page" : undefined}
            data-testid={`pagination-page-${item}`}
            disabled={disabled}
            onClick={() => {
              if (item !== current) {
                onPageChange(item);
              }
            }}
            className={[
              BUTTON_CLASSES,
              item === current
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
        disabled={disabled || current === total}
        onClick={() => onPageChange(current + 1)}
        className={`${BUTTON_CLASSES} border-gray-200 bg-white text-gray-600 hover:bg-gray-50`}
      >
        <ChevronRight className="rtl-mirror" size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}
