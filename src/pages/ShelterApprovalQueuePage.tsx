import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { adoptionService } from "../api/adoptionService";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/emptyState";

export default function ShelterApprovalQueuePage() {
  const navigate = useNavigate();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch
  } = useInfiniteQuery({
    queryKey: ["shelterApprovals"],
    queryFn: ({ pageParam }) =>
      adoptionService.getAdminApprovalQueue({
        status: "PENDING",
        cursor: pageParam
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const allItems = useMemo(() =>
    data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  const handleRowClick = (id: string) => {
    navigate(`/adoption/${id}#approvals`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-[#0D162B] tracking-tight">
            Pending Shelter Approvals
          </h1>
          <p className="mt-2 text-gray-500 font-medium">
            Review and approve pending adoptions for your shelter.
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="p-0">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} variant="row" className="h-16 border-b" />
              ))}
            </div>
          ) : isError ? (
            <div className="py-20">
              <EmptyState
                title="Something went wrong"
                description="Failed to load approval queue. Please try again."
                action={{ label: "Retry", onClick: () => refetch() }}
              />
            </div>
          ) : allItems.length === 0 ? (
            <div className="py-20 text-center">
              <EmptyState
                title="No pending approvals"
                description="There are currently no adoptions awaiting your approval."
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Pet</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Adopter</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Submitted</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Waiting</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {allItems.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-[#FFF2E5]/30 cursor-pointer transition-colors group"
                        onClick={() => handleRowClick(item.id)}
                      >
                        <td className="px-6 py-5 font-semibold text-[#0D162B] text-sm">{item.pet}</td>
                        <td className="px-6 py-5 font-semibold text-[#0D162B] text-sm">{item.adopter}</td>
                        <td className="px-6 py-5 text-gray-500 text-sm">{new Date(item.submitted).toLocaleDateString()}</td>
                        <td className="px-6 py-5">
                          <span className={`text-sm font-bold ${item.daysWaiting > 3 ? "text-red-500" : "text-[#0D162B]"}`}>
                            {item.daysWaiting}d
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {hasNextPage && (
                <div className="flex justify-center py-6">
                  <button
                    className="px-6 py-2 rounded-lg bg-[#E84D2A] text-white font-bold hover:bg-[#d13e1c] transition"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? "Loading..." : "Load more"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
