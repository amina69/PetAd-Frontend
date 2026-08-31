import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { useApprovalList } from "../features/approval/hooks/useApprovalList";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/emptyState";
import type { DecisionStatus } from "../types/adoption";

// ─── Constants ───────────────────────────────────────────────────────────────

/** Number of skeleton cards rendered during loading — matches the default
 *  page size so the layout does not visually jump when real data arrives. */
const SKELETON_COUNT = 6;

type FilterTab = "all" | DecisionStatus;

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

/** Distinct empty-state copy for each filter tab. */
function emptyStateForTab(tab: FilterTab): { title: string; description: string } {
  switch (tab) {
    case "PENDING":
      return {
        title: "No pending requests right now",
        description: "All adoption requests have been reviewed or none have been submitted yet.",
      };
    case "APPROVED":
      return {
        title: "No approved requests",
        description: "No adoption requests have been approved yet.",
      };
    case "REJECTED":
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

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Skeleton card that mirrors the layout of a single approval list item. */
function ApprovalCardSkeleton() {
  return (
    <div
      data-testid="approval-card-skeleton"
      className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-white shadow-sm"
    >
      <div className="flex items-center gap-3 min-w-0">
        <Skeleton variant="text" width={36} height={36} className="rounded-full shrink-0" />
        <div className="flex flex-col gap-1.5 min-w-0">
          <Skeleton variant="text" width="120px" height={14} />
          <Skeleton variant="text" width="80px" height={12} />
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Skeleton variant="text" width={60} height={14} />
        <Skeleton variant="text" width={50} height={14} />
      </div>
    </div>
  );
}

/** Error state with retry button. Only one network call is triggered per click
 *  because `refetch` from TanStack Query deduplicates concurrent calls. */
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

// ─── Status label helper ─────────────────────────────────────────────────────

function statusLabel(status: string | undefined): string {
  if (!status) return "—";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

// ─── Main component ──────────────────────────────────────────────────────────

/**
 * ApprovalListPage
 *
 * Displays a filterable list of adoption approval requests with distinct
 * loading (skeleton cards), empty (tab-specific copy), and error (retry button)
 * states.
 *
 * @see https://github.com/amina69/PetAd-Frontend/issues/443
 */
export default function ApprovalListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as FilterTab) || "all";

  const handleTabChange = useCallback(
    (tab: FilterTab) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (tab === "all") {
          next.delete("tab");
        } else {
          next.set("tab", tab);
        }
        return next;
      });
    },
    [setSearchParams],
  );

  const params = useMemo(
    () => ({
      status: activeTab === "all" ? undefined : activeTab,
      limit: SKELETON_COUNT,
    }),
    [activeTab],
  );

  const { data, isLoading, isError, error, refetch } = useApprovalList(params);
  const items = useMemo(() => data?.items ?? [], [data]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-[#0D162B] tracking-tight">
            Approvals
          </h1>
          <p className="mt-2 text-gray-500 font-medium">
            View and manage adoption approval requests
          </p>
        </div>

        {/* Filter tabs */}
        <div
          role="tablist"
          aria-label="Approval status filters"
          className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit"
        >
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              role="tab"
              aria-selected={activeTab === tab.value}
              data-testid={`tab-${tab.value}`}
              onClick={() => handleTabChange(tab.value)}
              className={[
                "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
                activeTab === tab.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            /* ── Loading state: skeleton cards matching ApprovalCard dimensions ── */
            <div
              data-testid="approval-loading"
              className="flex flex-col divide-y divide-gray-50"
            >
              {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <ApprovalCardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            /* ── Error state: retry button ── */
            <ApprovalErrorState onRetry={() => refetch()} />
          ) : items.length === 0 ? (
            /* ── Empty state: distinct copy per filter tab ── */
            <div className="py-20 text-center">
              <EmptyState {...emptyStateForTab(activeTab)} />
            </div>
          ) : (
            /* ── Data state ── */
            <div
              role="list"
              aria-label="Approval requests"
              className="flex flex-col divide-y divide-gray-50"
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  role="listitem"
                  data-testid={`approval-item-${item.id}`}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-[#FFF2E5]/30 transition-colors cursor-pointer"
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
                  <div className="flex items-center gap-3 shrink-0">
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

          {/* Suppress TypeScript unused-variable warning for `error` — it is
              available for richer error display in the future. */}
          {error ? null : null}
        </div>
      </div>
    </div>
  );
}
