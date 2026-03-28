import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApiQuery } from "../hooks/useApiQuery";
import { EscrowStatusBadge } from "../components/ui/EscrowStatusBadge";

interface Dispute {
  id: string;
  petName: string;
  opponentName: string;
  status: string;
  createdAt: string;
}

interface DisputesResponse {
  disputes: Dispute[];
  total: number;
  page: number;
  pageSize: number;
}

const ITEMS_PER_PAGE = 10;

export default function MyDisputesPage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isError } = useApiQuery<DisputesResponse>(
    ["disputes", currentPage],
    () =>
      fetch(`/api/disputes?page=${currentPage}&pageSize=${ITEMS_PER_PAGE}`).then(
        (res) => res.json()
      )
  );

  const disputes = data?.disputes || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">
            My Disputes
          </h1>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border border-slate-200 bg-white p-4 h-20"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-white py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">
            My Disputes
          </h1>
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-medium text-red-900">
              Failed to load disputes. Please try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          My Disputes
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          {total} dispute{total !== 1 ? "s" : ""}
        </p>

        {disputes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <p className="mt-4 text-sm font-medium text-slate-600">
              No disputes yet
            </p>
            <p className="text-xs text-slate-500">
              Active disputes will appear here
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {disputes.map((dispute) => (
                <button
                  key={dispute.id}
                  onClick={() => navigate(`/disputes/${dispute.id}`)}
                  className="w-full text-left rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">
                        Dispute #{dispute.id}
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-slate-900">
                        {dispute.petName}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Opponent: {dispute.opponentName}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div>
                        <p className="text-xs text-slate-500">Filed on</p>
                        <p className="text-sm font-medium text-slate-900">
                          {formatDate(dispute.createdAt)}
                        </p>
                      </div>
                      <div className="min-w-fit">
                        <EscrowStatusBadge status={dispute.status} />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 pt-6">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const page = i + 1;
                    const isCurrentPage = page === currentPage;
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            isCurrentPage
                              ? "bg-slate-900 text-white"
                              : "border border-slate-200 text-slate-900 hover:bg-slate-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      (page === 2 && currentPage > 3) ||
                      (page === totalPages - 1 && currentPage < totalPages - 2)
                    ) {
                      return (
                        <span
                          key={page}
                          className="px-2 text-slate-600"
                        >
                          ...
                        </span>
                      );
                    }
                  })}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
