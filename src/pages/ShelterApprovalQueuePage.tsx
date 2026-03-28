import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApiQuery } from "../hooks/useApiQuery";
import { shelterService } from "../api/shelterService";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/emptyState";
import { ClockIcon } from "../components/icons/StatusIcons";
import type { ShelterApprovalQueueItem } from "../types/shelter";

const ShelterApprovalQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ShelterApprovalQueueItem[]>([]);

  const { data, isLoading, isError } = useApiQuery(
    ["shelter", "approvals", "PENDING", page],
    () => shelterService.getApprovals("PENDING", page)
  );

  useEffect(() => {
    if (data?.items) {
      if (page === 1) {
        setItems(data.items);
      } else {
        setItems((prev: ShelterApprovalQueueItem[]) => [...prev, ...data.items]);
      }
    }
  }, [data, page]);

  const calculateDaysWaiting = (dateStr: string) => {
    const submissionDate = new Date(dateStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - submissionDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleRowClick = (id: string) => {
    navigate(`/adoption/${id}#approvals`);
  };

  const sortedItems = [...items].sort((a, b) => {
    return new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime();
  });

  if (isLoading && page === 1) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Approval Queue</h1>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="row" height="80px" className="rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError && page === 1) {
    return (
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EmptyState 
            title="Error loading approvals" 
            description="Failed to load the approval queue. Please try again later."
          />
       </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Approval Queue</h1>
        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
          {items.length} Pending
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No pending approvals"
          description="The approval queue is empty. New adoption requests will appear here."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pet</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Adopter</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Submission Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Waiting For</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item.id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0">
                          {item.petPhotoUrl ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover border border-gray-200"
                              src={item.petPhotoUrl}
                              alt={item.petName}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center border border-orange-200">
                              <span className="text-orange-600 font-bold text-sm">
                                {item.petName.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-bold text-gray-900">{item.petName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-semibold">{item.adopterName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(item.submissionDate).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 ring-1 ring-inset ring-orange-600/20">
                        <ClockIcon />
                        {calculateDaysWaiting(item.submissionDate)} days waiting
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data?.hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setPage((prev) => prev + 1)}
            disabled={isLoading}
            className="bg-white border border-gray-200 text-gray-900 px-6 py-2 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all hover:bg-gray-50 disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ShelterApprovalQueuePage;
