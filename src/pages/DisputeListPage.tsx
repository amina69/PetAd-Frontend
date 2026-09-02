import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DisputeStatusBadge } from "../components/dispute/DisputeStatusBadge";
import { EmptyState } from "../components/ui/emptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { useDisputes } from "../hooks/useDisputes";
import type { DisputeStatus } from "../types/dispute";

/**
 * DisputeListPage — user-facing list of open disputes.
 *
 * States handled:
 *  - Loading  : Skeleton table rows while the first page is fetching.
 *  - Empty    : "No open disputes" EmptyState when the list is empty.
 *  - Error    : Inline error banner with a Retry action.
 *  - Data     : Paginated dispute rows with a "Load more" button.
 */
export default function DisputeListPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | "all">("all");

  const {
    disputes,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isLoadingMore,
    refetch,
  } = useDisputes({ status: statusFilter });

  const getEmptyDescription = () => {
    if (statusFilter !== "all") {
      return `No disputes found with status "${statusFilter}".`;
    }
    return "You have no open disputes at the moment. Any disputes you raise will appear here.";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Page header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Disputes</h1>
            <p className="text-sm text-gray-500 mt-1">
              Track and manage disputes you have raised.
            </p>
          </div>
        </div>

        {/* ── Status filter ───────────────────────────────────── */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
          <label
            htmlFor="dispute-status-filter"
            className="text-sm font-medium text-gray-700 shrink-0"
          >
            Filter by status:
          </label>
          <select
            id="dispute-status-filter"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as DisputeStatus | "all")
            }
            className="block rounded-md border-gray-300 py-1.5 pl-3 pr-8 text-sm focus:border-emerald-500 focus:ring-emerald-500 bg-gray-50 text-gray-900 shadow-sm border"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* ── Error banner ────────────────────────────────────── */}
        {isError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center justify-between"
          >
            <p className="text-sm font-medium text-red-800">
              Failed to load disputes. Please try again.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="text-sm bg-white text-red-700 border border-red-200 px-3 py-1.5 rounded-md hover:bg-red-50 font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Table ───────────────────────────────────────────── */}
        {!isError && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      ID
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Pet
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Reason
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Raised Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">

                  {/* ── Loading state: skeleton rows ── */}
                  {isLoading &&
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={`dispute-list-skeleton-${i}`} aria-hidden="true">
                        <td className="px-6 py-4">
                          <Skeleton width="60%" />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton width="80%" />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton width="70%" />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton width="90%" />
                        </td>
                        <td className="px-6 py-4">
                          <Skeleton width="100%" />
                        </td>
                      </tr>
                    ))}

                  {/* ── Empty state ── */}
                  {!isLoading && disputes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12">
                        <EmptyState
                          title="No open disputes"
                          description={getEmptyDescription()}
                        />
                      </td>
                    </tr>
                  )}

                  {/* ── Data rows ── */}
                  {!isLoading &&
                    disputes.map((dispute) => (
                      <tr
                        key={dispute.id}
                        onClick={() => navigate(`/disputes/${dispute.id}`)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors group"
                        tabIndex={0}
                        role="button"
                        aria-label={`View dispute ${dispute.id}`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            navigate(`/disputes/${dispute.id}`);
                          }
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 group-hover:text-emerald-600">
                          {dispute.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {dispute.pet.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {dispute.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(dispute.createdAt).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <DisputeStatusBadge status={dispute.status} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* ── Load more ── */}
            {!isLoading && hasNextPage && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-center">
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isLoadingMore}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoadingMore ? "Loading more…" : "Load more"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
