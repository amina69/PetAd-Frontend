import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDisputes } from "../hooks/useDisputes";
import { DisputeStatusBadge } from "../components/dispute/DisputeStatusBadge";
import { DisputeSLABadge } from "../components/dispute/DisputeSLABadge";
import { EmptyState } from "../components/ui/emptyState";
import { Skeleton } from "../components/ui/Skeleton";
import type { DisputeStatus } from "../types/dispute";

export default function AdminDisputeListPage() {
  const navigate = useNavigate();

  // Filters State
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | "all">("all");
  const [isOverdueFilter, setIsOverdueFilter] = useState<boolean>(false);

  // Data fetching via TanStack Query Infinite Query
  const {
    disputes,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isLoadingMore,
    refetch,
  } = useDisputes({
    status: statusFilter,
    overdue: isOverdueFilter,
  });

  const handleRowClick = (id: string) => {
    navigate(`/disputes/${id}`);
  };

  const getEmptyDescription = () => {
    if (statusFilter !== "all" && isOverdueFilter) {
      return `No disputes found for status "${statusFilter}" with SLA breached.`;
    }

    if (statusFilter !== "all") {
      return `No disputes found for status "${statusFilter}".`;
    }

    if (isOverdueFilter) {
      return "No SLA-breached disputes found.";
    }

    return "No disputes are available yet.";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Disputes Administration</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and review all adoption disputes and their SLAs.</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">Status:</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as DisputeStatus | "all")}
                className="block w-full rounded-md border-gray-300 py-1.5 pl-3 pr-8 text-sm focus:border-emerald-500 focus:ring-emerald-500 bg-gray-50 text-gray-900 shadow-sm border"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={isOverdueFilter}
                  onChange={(e) => setIsOverdueFilter(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none ring-0 peer-focus:ring-2 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500 shadow-inner"></div>
              </div>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">SLA Breached Only</span>
            </label>
          </div>
          
        </div>

        {/* Error Handling */}
        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center justify-between">
            <p className="text-sm font-medium text-red-800">Failed to load disputes. Please try again.</p>
            <button 
              onClick={() => refetch()} 
              className="text-sm bg-white text-red-700 border border-red-200 px-3 py-1.5 rounded-md hover:bg-red-50 font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table Content */}
        {!isError && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pet</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Adopter</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Shelter</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Raised Date</th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">SLA</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  
                  {/* Loading State Skeleton */}
                  {isLoading && Array.from({ length: 3 }).map((_, i) => (
                    <tr key={`skeleton-${i}`}>
                      <td className="px-6 py-4"><Skeleton width="60%" /></td>
                      <td className="px-6 py-4"><Skeleton width="80%" /></td>
                      <td className="px-6 py-4"><Skeleton width="70%" /></td>
                      <td className="px-6 py-4"><Skeleton width="50%" /></td>
                      <td className="px-6 py-4"><Skeleton width="90%" /></td>
                      <td className="px-6 py-4"><Skeleton width="100%" /></td>
                      <td className="px-6 py-4"><Skeleton width="100%" /></td>
                    </tr>
                  ))}

                  {/* Empty State */}
                  {!isLoading && disputes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12">
                        <EmptyState 
                          title="No disputes found" 
                          description={getEmptyDescription()}
                        />
                      </td>
                    </tr>
                  )}

                  {/* Data rendering */}
                  {!isLoading && disputes.map((dispute) => (
                    <tr 
                      key={dispute.id} 
                      onClick={() => handleRowClick(dispute.id)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors group"
                      tabIndex={0}
                      role="button"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleRowClick(dispute.id);
                        }
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 group-hover:text-emerald-600">
                        {dispute.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{dispute.pet.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dispute.adopter.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dispute.shelter.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(dispute.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <DisputeStatusBadge status={dispute.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <DisputeSLABadge isOverdue={dispute.isOverdue} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Load More */}
            {!isLoading && hasNextPage && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-center">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isLoadingMore}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoadingMore ? "Loading more..." : "Load more"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
