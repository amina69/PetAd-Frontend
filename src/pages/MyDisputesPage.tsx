import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DisputeStatusBadge } from "../components/dispute/DisputeStatusBadge";
import { EmptyState } from "../components/ui/emptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { useApiQuery } from "../hooks/useApiQuery";
import { apiClient } from "../lib/api-client";
import type { Dispute, DisputeListResponse, DisputeUser } from "../types/dispute";

type DisputeWithOpponent = Dispute & { opponent?: DisputeUser };

function resolveOpponentName(dispute: DisputeWithOpponent): string {
  if (dispute.opponent?.name) {
    return dispute.opponent.name;
  }

  if (dispute.raisedBy === dispute.adopter.id) {
    return dispute.shelter.name;
  }

  if (dispute.raisedBy === dispute.shelter.id) {
    return dispute.adopter.name;
  }

  return dispute.adopter.name;
}

export default function MyDisputesPage() {
  const navigate = useNavigate();
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [disputes, setDisputes] = useState<DisputeWithOpponent[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);

  const { data, isLoading, isError } = useApiQuery<DisputeListResponse>(
    ["my-disputes", cursor],
    () => {
      const params = new URLSearchParams();

      if (cursor) {
        params.append("cursor", cursor);
      }

      const query = params.toString();
      const endpoint = query ? `/disputes?${query}` : "/disputes";

      return apiClient.get<DisputeListResponse>(endpoint);
    }
  );

  useEffect(() => {
    if (!data) {
      return;
    }

    setNextCursor(data.nextCursor);

    setDisputes((previous) => {
      if (!cursor) {
        return data.data;
      }

      const previousIds = new Set(previous.map((item) => item.id));
      const incoming = data.data.filter((item) => !previousIds.has(item.id));

      return [...previous, ...incoming];
    });
  }, [data, cursor]);

  const isInitialLoading = isLoading && disputes.length === 0;
  const isLoadingMore = isLoading && disputes.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Disputes</h1>
          <p className="text-sm text-gray-500 mt-1">
            View all disputes you have filed.
          </p>
        </div>

        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">
              Failed to load disputes. Please try again.
            </p>
          </div>
        )}

        {!isError && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pet</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Opponent</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Raised Date</th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {isInitialLoading &&
                    Array.from({ length: 3 }).map((_, index) => (
                      <tr key={`my-disputes-skeleton-${index}`}>
                        <td className="px-6 py-4"><Skeleton width="60%" /></td>
                        <td className="px-6 py-4"><Skeleton width="80%" /></td>
                        <td className="px-6 py-4"><Skeleton width="70%" /></td>
                        <td className="px-6 py-4"><Skeleton width="90%" /></td>
                        <td className="px-6 py-4"><Skeleton width="100%" /></td>
                      </tr>
                    ))}

                  {!isInitialLoading && disputes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12">
                        <EmptyState
                          title="No disputes filed"
                          description="Any disputes you raise will appear here."
                        />
                      </td>
                    </tr>
                  )}

                  {!isInitialLoading &&
                    disputes.map((dispute) => (
                      <tr
                        key={dispute.id}
                        onClick={() => navigate(`/disputes/${dispute.id}`)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors group"
                        tabIndex={0}
                        role="button"
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {resolveOpponentName(dispute)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(dispute.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <DisputeStatusBadge status={dispute.status} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {!isInitialLoading && nextCursor && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-center">
                <button
                  onClick={() => setCursor(nextCursor)}
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
