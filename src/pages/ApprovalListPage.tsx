import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useApprovalList } from "../features/approval/hooks/useApprovalList";
import type { ApprovalItem } from "../features/approval/types/approval.types";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/emptyState";

// ─── Constants ───────────────────────────────────────────────────────────────

/**
 * Page size shared by the API request and the skeleton placeholders so the
 * loading state does not visually jump when the real data arrives.
 */
const PAGE_SIZE = 6;

/** Maximum number of page buttons rendered in the pagination control. */
const MAX_VISIBLE_PAGES = 5;

/** Query-string keys owned by this page. */
const STATUS_PARAM = "status";
const SORT_PARAM = "sort";
const PAGE_PARAM = "page";

/** Status filter shown in the tab strip. `all` means "no status filter". */
type StatusFilter = "all" | "pending" | "approved" | "rejected";

/** Sort order applied to the approval list. */
type SortOrder = "date_desc" | "date_asc" | "status_asc" | "status_desc";

const DEFAULT_SORT: SortOrder = "date_desc";

const FILTER_TABS: {
  value: StatusFilter;
  label: string;
  /** Value sent to the API; `undefined` means "do not filter by status". */
  apiStatus?: string;
}[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending", apiStatus: "PENDING" },
  { value: "approved", label: "Approved", apiStatus: "APPROVED" },
  { value: "rejected", label: "Rejected", apiStatus: "REJECTED" },
];

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "date_desc", label: "Newest first" },
  { value: "date_asc", label: "Oldest first" },
  { value: "status_asc", label: "Status (A-Z)" },
  { value: "status_desc", label: "Status (Z-A)" },
];

// ─── Empty-state copy ────────────────────────────────────────────────────────

/** Distinct empty-state copy for each filter tab. */
function emptyStateForTab(tab: StatusFilter): { title: string; description: string } {
  switch (tab) {
    case "pending":
      return {
        title: "No pending requests right now",
        description: "All adoption requests have been reviewed or none have been submitted yet.",
      };
    case "approved":
      return {
        title: "No approved requests",
        description: "No adoption requests have been approved yet.",
      };
    case "rejected":
      return {
        title: "No rejection history yet",
        description: "No adoption requests have been rejected.",
      };
    default:
      return {
        title: "No approval history yet",
        description: "Adoption requests will appear here once they are submitted.",
      };
  }
}

// ─── URL state helpers ───────────────────────────────────────────────────────

/** Reads the `status` query param, falling back to "all" for unknown values. */
function parseStatusFilter(raw: string | null): StatusFilter {
  const value = (raw ?? "").trim().toLowerCase();
  const match = FILTER_TABS.find((tab) => tab.value === value);

  return match ? match.value : "all";
}

/** Reads the `sort` query param, falling back to the default for unknown values. */
function parseSortOrder(raw: string | null): SortOrder {
  const value = (raw ?? "").trim().toLowerCase();
  const match = SORT_OPTIONS.find((option) => option.value === value);

  return match ? match.value : DEFAULT_SORT;
}

/** Reads the `page` query param, falling back to page 1 for invalid values. */
function parsePage(raw: string | null): number {
  const value = (raw ?? "").trim();

  // Only accept a plain positive integer — "2abc" or "-1" are not valid pages.
  if (!/^\d+$/.test(value)) return 1;

  const page = Number.parseInt(value, 10);

  return Number.isFinite(page) && page > 0 ? page : 1;
}

/** Builds the window of page numbers shown in the pagination control. */
function buildPageNumbers(current: number, totalPages: number): number[] {
  if (totalPages <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.max(
    1,
    Math.min(current - Math.floor(MAX_VISIBLE_PAGES / 2), totalPages - MAX_VISIBLE_PAGES + 1),
  );

  return Array.from({ length: MAX_VISIBLE_PAGES }, (_, index) => start + index);
}

// ─── Sorting helpers ─────────────────────────────────────────────────────────

/** Status label used both in the badge and as the sort key. */
function statusLabel(status: string | undefined): string {
  if (!status) return "—";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

/** Submission timestamp of an approval; missing/invalid dates sort last. */
function submittedTimestamp(item: ApprovalItem): number {
  if (!item.submittedAt) return 0;

  const timestamp = new Date(item.submittedAt).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

/**
 * Sorts a page of approvals.
 *
 * The selected order is also forwarded to the API as `sort`, so the server can
 * order the whole collection. This client-side pass keeps the rendered order
 * deterministic for backends that do not implement the parameter yet.
 */
function sortApprovals(items: ApprovalItem[], sort: SortOrder): ApprovalItem[] {
  const sorted = [...items];

  sorted.sort((a, b) => {
    switch (sort) {
      case "date_asc":
        return submittedTimestamp(a) - submittedTimestamp(b);
      case "status_asc":
        return statusLabel(a.status).localeCompare(statusLabel(b.status));
      case "status_desc":
        return statusLabel(b.status).localeCompare(statusLabel(a.status));
      case "date_desc":
      default:
        return submittedTimestamp(b) - submittedTimestamp(a);
    }
  });

  return sorted;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Skeleton card that mirrors the layout of a single approval list item. */
function ApprovalCardSkeleton() {
  return (
    <div
      data-testid="approval-card-skeleton"
      className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center gap-3 min-w-0">
        <Skeleton variant="text" width={36} height={36} className="rounded-full shrink-0" />
        <div className="flex flex-col gap-1.5 min-w-0">
          <Skeleton variant="text" width="120px" height={14} />
          <Skeleton variant="text" width="80px" height={12} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <Skeleton variant="text" width={90} height={12} />
        <Skeleton variant="text" width={60} height={14} />
      </div>
    </div>
  );
}

/** Error state with retry button. Only one network call is triggered per click
 * because `refetch` from TanStack Query deduplicates concurrent calls. */
function ApprovalErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      data-testid="approval-error"
      className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center my-8"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-500">
        <RefreshCw size={24} aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-gray-900">Something went wrong</p>
        <p className="text-sm text-gray-500">Failed to load the approval list. Please try again.</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        data-testid="retry-button"
        className="mt-2 inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 transition-colors"
      >
        <RefreshCw size={14} aria-hidden="true" />
        Retry
      </button>
    </div>
  );
}

/** Prev/next + page-number pagination control driven by the `page` query param. */
function ApprovalPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = buildPageNumbers(currentPage, totalPages);

  const buttonClass =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav
      aria-label="Approval list pagination"
      data-testid="approval-pagination"
      className="mt-6 flex flex-wrap items-center justify-center gap-2"
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        data-testid="pagination-prev"
        aria-label="Previous page"
        className={buttonClass}
      >
        <ChevronLeft size={16} aria-hidden="true" />
      </button>

      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          data-testid={`pagination-page-${page}`}
          aria-current={page === currentPage ? "page" : undefined}
          className={[
            buttonClass,
            page === currentPage
              ? "border-orange-600 bg-orange-600 text-white hover:bg-orange-700"
              : "",
          ].join(" ")}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        data-testid="pagination-next"
        aria-label="Next page"
        className={buttonClass}
      >
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

/**
 * ApprovalListPage
 *
 * Displays a filterable list of adoption approval requests with distinct
 * loading (skeleton cards), empty (tab-specific copy), and error (retry button)
 * states.
 *
 * The status tab, sort order and page number are the single source of truth
 * and live in the query string (`?status=pending&sort=date_desc&page=2`), so a
 * hard refresh restores the exact view the user was looking at.
 *
 * @see https://github.com/amina69/PetAd-Frontend/issues/600
 */
export default function ApprovalListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // ── URL state (read) ───────────────────────────────────────────────────────
  const activeStatus = parseStatusFilter(searchParams.get(STATUS_PARAM));
  const activeSort = parseSortOrder(searchParams.get(SORT_PARAM));
  const currentPage = parsePage(searchParams.get(PAGE_PARAM));

  const apiStatus = FILTER_TABS.find((tab) => tab.value === activeStatus)?.apiStatus;

  // ── URL state (write) ──────────────────────────────────────────────────────
  const writeUrlState = useCallback(
    (
      next: { status: StatusFilter; sort: SortOrder; page: number },
      options?: { replace?: boolean },
    ) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          // Delete first so the three params always end up in a stable order
          // (status → sort → page), no matter how the URL was built.
          params.delete(STATUS_PARAM);
          params.delete(SORT_PARAM);
          params.delete(PAGE_PARAM);
          params.set(STATUS_PARAM, next.status);
          params.set(SORT_PARAM, next.sort);
          params.set(PAGE_PARAM, String(next.page));
          return params;
        },
        options,
      );
    },
    [setSearchParams],
  );

  const handleTabChange = useCallback(
    (status: StatusFilter) => {
      // A new filter invalidates the current page — start again from page 1.
      writeUrlState({ status, sort: activeSort, page: 1 });
    },
    [activeSort, writeUrlState],
  );

  const handleSortChange = useCallback(
    (sort: SortOrder) => {
      writeUrlState({ status: activeStatus, sort, page: 1 });
    },
    [activeStatus, writeUrlState],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      writeUrlState({ status: activeStatus, sort: activeSort, page });
    },
    [activeStatus, activeSort, writeUrlState],
  );

  // ── Data ───────────────────────────────────────────────────────────────────
  const params = useMemo(
    () => ({
      status: apiStatus,
      sort: activeSort,
      page: currentPage,
      limit: PAGE_SIZE,
    }),
    [apiStatus, activeSort, currentPage],
  );

  const { data, isLoading, isError, refetch } = useApprovalList(params);

  const items = useMemo(
    () => sortApprovals(data?.items ?? [], activeSort),
    [data, activeSort],
  );

  /** Total number of matching approvals; `undefined` when the API omits it. */
  const total = typeof data?.total === "number" ? data.total : undefined;

  /** Number of pages when the API reports the total; used to clamp bad URLs. */
  const knownTotalPages =
    total === undefined ? undefined : Math.max(1, Math.ceil(total / PAGE_SIZE));

  /**
   * Number of pages to render. When the API does not report a total we cannot
   * know how many pages exist, so a full page is assumed to be followed by
   * another one.
   */
  const totalPages =
    knownTotalPages ??
    (items.length >= PAGE_SIZE ? currentPage + 1 : currentPage);

  // A stale page number (?page=99) would render an empty list — fall back to
  // the last valid page instead. The correction replaces the current history
  // entry so the Back button does not walk into the invalid URL again.
  useEffect(() => {
    if (isLoading || isError || knownTotalPages === undefined) return;
    if (currentPage <= knownTotalPages) return;

    writeUrlState(
      { status: activeStatus, sort: activeSort, page: knownTotalPages },
      { replace: true },
    );
  }, [
    activeSort,
    activeStatus,
    currentPage,
    isError,
    isLoading,
    knownTotalPages,
    writeUrlState,
  ]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-[#0D162B] tracking-tight">
            Approvals
          </h1>
          <p className="mt-2 text-gray-500 font-medium">
            View and manage adoption approval requests
          </p>
        </div>

        {/* Filter tabs + sort dropdown */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="tablist"
            aria-label="Approval status filters"
            className="flex flex-wrap gap-1 bg-gray-100 rounded-lg p-1 w-fit"
          >
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                role="tab"
                aria-selected={activeStatus === tab.value}
                aria-controls="approval-status-panel"
                data-testid={`tab-${tab.value}`}
                onClick={() => handleTabChange(tab.value)}
                className={[
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors sm:px-4",
                  activeStatus === tab.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="approval-sort"
              className="text-xs font-bold uppercase tracking-wider text-gray-400"
            >
              Sort by
            </label>
            <select
              id="approval-sort"
              data-testid="sort-select"
              value={activeSort}
              onChange={(event) => handleSortChange(event.target.value as SortOrder)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div id="approval-status-panel" role="tabpanel" tabIndex={0} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            /* ── Loading state: skeleton cards matching the approval card ── */
            <div
              data-testid="approval-loading"
              className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <ApprovalCardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            /* ── Error state: retry button ── */
            <ApprovalErrorState onRetry={() => refetch()} />
          ) : items.length === 0 ? (
            /* ── Empty state: distinct copy per filter tab ── */
            <div className="py-20 text-center">
              <EmptyState {...emptyStateForTab(activeStatus)} />
            </div>
          ) : (
            /* ── Data state ── */
            <div
              role="list"
              aria-label="Approval requests"
              data-testid="approval-grid"
              className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  role="listitem"
                  data-testid={`approval-item-${item.id}`}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:bg-[#FFF2E5]/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                      {(item.applicantName ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0D162B] truncate">
                        {item.petName ?? "Unknown pet"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {item.applicantName ?? "Unknown applicant"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-gray-500">
                      {item.submittedAt
                        ? new Date(item.submittedAt).toLocaleDateString()
                        : "—"}
                    </span>
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        item.status === "APPROVED"
                          ? "bg-green-50 text-green-700"
                          : item.status === "REJECTED"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700",
                      ].join(" ")}
                    >
                      {statusLabel(item.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Pagination ── */}
          {!isLoading && !isError && totalPages > 1 && (
            <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
              <ApprovalPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
