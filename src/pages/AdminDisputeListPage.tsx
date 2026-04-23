import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, MoreHorizontal } from "lucide-react";
import { useDisputes } from "../hooks/useDisputes";
import { DisputeStatusBadge } from "../components/dispute/DisputeStatusBadge";
import { DisputeSLABadge } from "../components/dispute/DisputeSLABadge";
import { EmptyState } from "../components/ui/emptyState";
import { Skeleton } from "../components/ui/Skeleton";
import type { DisputeStatus } from "../types/dispute";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function emptyTitle(status: DisputeStatus | "all", overdue: boolean): string {
  if (overdue && status !== "all") return `No breached "${status}" disputes`;
  if (overdue) return "No SLA-breached disputes";
  if (status !== "all") return `No "${status}" disputes`;
  return "No disputes found";
}

function emptyDescription(status: DisputeStatus | "all", overdue: boolean): string {
  if (overdue && status !== "all")
    return `There are no ${status} disputes that have breached their SLA.`;
  if (overdue)
    return "Great — all open disputes are currently within their SLA window.";
  if (status !== "all")
    return `There are no disputes with status "${status}" at the moment.`;
  return "No adoption disputes have been raised yet.";
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminDisputeListPage() {
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<DisputeStatus | "all">("all");
  const [isOverdueFilter, setIsOverdueFilter] = useState(false);

  const {
    disputes,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isLoadingMore,
    refetch,
  } = useDisputes({ status: statusFilter, overdue: isOverdueFilter });

  const handleRowClick = (id: string) => navigate(`/disputes/${id}`);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-3xl font-extrabold text-[#0D162B] tracking-tight">
            Disputes Administration
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and review all adoption disputes and their SLAs.
          </p>
        </div>

        {/* ── Filter bar ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col sm:flex-row sm:items-center gap-4">

          {/* Status select */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="status-filter"
              className="text-sm font-medium text-gray-700 whitespace-nowrap"
            >
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as DisputeStatus | "all")
              }
              className="rounded-xl border border-gray-200 bg-gray-50 py-2 pl-3 pr-8 text-sm font-medium text-[#0D162B] outline-none focus:border-[#E84D2A] focus:ring-2 focus:ring-[#E84D2A]/20 transition-all"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* SLA Breached toggle — prominently placed on the right */}
          <button
            type="button"
            role="switch"
            aria-checked={isOverdueFilter}
            aria-label="Show SLA breached disputes only"
            data-testid="sla-filter-toggle"
            onClick={() => setIsOverdueFilter((v) => !v)}
            className={[
              "flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all select-none cursor-pointer",
              isOverdueFilter
                ? "border-red-300 bg-red-50 text-red-700 shadow-sm shadow-red-100"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300",
            ].join(" ")}
          >
            <AlertCircle
              className={`w-4 h-4 ${isOverdueFilter ? "text-red-500" : "text-gray-400"}`}
            />
            SLA Breached Only
            {/* pill toggle */}
            <div
              className={`w-9 h-5 rounded-full p-0.5 transition-colors ${isOverdueFilter ? "bg-red-500" : "bg-gray-300"}`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isOverdueFilter ? "translate-x-4" : "translate-x-0"}`}
              />
            </div>
          </button>
        </div>

        {/* ── Error banner ───────────────────────────────────────────────── */}
        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center justify-between">
            <p className="text-sm font-medium text-red-800">
              Failed to load disputes. Please try again.
            </p>
            <button
              onClick={() => refetch()}
              className="text-sm bg-white text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Table card ─────────────────────────────────────────────────── */}
        {!isError && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {["ID", "Raised Date", "Pet", "Adopter", "Shelter", "Status", "SLA"].map(
                      (h) => (
                        <th
                          key={h}
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                  {/* Loading skeletons */}
                  {isLoading &&
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={`sk-${i}`}>
                        {Array.from({ length: 7 }).map((__, j) => (
                          <td key={j} className="px-6 py-4">
                            <Skeleton />
                          </td>
                        ))}
                      </tr>
                    ))}

                  {/* Empty state */}
                  {!isLoading && disputes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-16">
                        <EmptyState
                          title={emptyTitle(statusFilter, isOverdueFilter)}
                          description={emptyDescription(statusFilter, isOverdueFilter)}
                        />
                      </td>
                    </tr>
                  )}

                  {/* Data rows */}
                  {!isLoading &&
                    disputes.map((dispute) => (
                      <tr
                        key={dispute.id}
                        role="button"
                        tabIndex={0}
                        data-testid="dispute-row"
                        onClick={() => handleRowClick(dispute.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleRowClick(dispute.id);
                          }
                        }}
                        className="hover:bg-[#FFF2E5]/40 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-500 group-hover:text-[#E84D2A]">
                          {dispute.id.slice(0, 12)}…
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(dispute.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#0D162B]">
                          {dispute.pet.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {dispute.adopter.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {dispute.shelter.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <DisputeStatusBadge status={dispute.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <DisputeSLABadge isOverdue={dispute.isOverdue} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Load more */}
            {!isLoading && hasNextPage && (
              <div className="border-t border-gray-100 px-6 py-4 flex justify-center">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isLoadingMore}
                  data-testid="load-more"
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-[#0D162B] hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-200 border-t-[#E84D2A] rounded-full animate-spin" />
                      Loading…
                    </>
                  ) : (
                    <>
                      <MoreHorizontal size={16} />
                      Load more
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
