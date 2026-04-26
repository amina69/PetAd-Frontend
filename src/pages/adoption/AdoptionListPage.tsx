import React, { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { StatusFilterChips } from "../../components/filters/StatusFilterChips";
import { useAdoptionList, type AdoptionStatus } from "../../hooks/useAdoptionList";
import { getStatusesFromParams, setStatusesInParams } from "../../utils/queryParams";

export const AdoptionListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read statuses from URL
  const selectedStatuses = useMemo(() => {
    return getStatusesFromParams(searchParams) as AdoptionStatus[];
  }, [searchParams]);

  const { data, isLoading, counts } = useAdoptionList({ status: selectedStatuses });

  // Update URL params
  const handleFilterChange = (statuses: AdoptionStatus[]) => {
    setSearchParams((prev) => setStatusesInParams(prev, statuses));
  };

  // Generate dynamic empty state message
  const emptyStateMessage = useMemo(() => {
    if (selectedStatuses.length === 0) {
      return "No adoptions found";
    }
    
    const formattedStatuses = selectedStatuses
      .map(s => s.toLowerCase())
      .join(" or ");
      
    return `No ${formattedStatuses} adoptions`;
  }, [selectedStatuses]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Adoption List</h1>
      
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Filter by Status</h2>
        <StatusFilterChips
          selectedStatuses={selectedStatuses}
          counts={counts}
          onChange={handleFilterChange}
        />
      </div>

      <div>
        {isLoading ? (
          <div className="flex justify-center items-center py-20" data-testid="loading-spinner">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg py-16 px-6 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900" data-testid="empty-state-message">
              {emptyStateMessage}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters to find what you're looking for.
            </p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200" data-testid="adoption-list">
              {data.map((adoption) => (
                <li key={adoption.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-blue-600 truncate">{adoption.petName}</p>
                      <p className="text-sm text-gray-500">Applicant: {adoption.applicantName}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-gray-100 text-gray-800">
                        {adoption.status.toLowerCase()}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">{adoption.date}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
