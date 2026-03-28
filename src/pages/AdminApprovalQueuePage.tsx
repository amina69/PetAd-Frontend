import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { 
  Search, 
  Filter, 
  ChevronDown, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  MoreHorizontal
} from "lucide-react";
import { adoptionService } from "../api/adoptionService";
import { StatusFilterChips } from "../components/ui/StatusFilterChips";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/emptyState";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "SHELTER_APPROVED", label: "Shelter Approved" },
  { value: "ADMIN_APPROVED", label: "Admin Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export default function AdminApprovalQueuePage() {
  const navigate = useNavigate();
  const [shelterFilter, setShelterFilter] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch
  } = useInfiniteQuery({
    queryKey: ["adminApprovals", shelterFilter, statusFilters, showOverdueOnly],
    queryFn: ({ pageParam }) => 
      adoptionService.getAdminApprovalQueue({
        shelter: shelterFilter || undefined,
        status: statusFilters.join(",") || undefined,
        overdueOnly: showOverdueOnly,
        cursor: pageParam
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const allItems = useMemo(() => 
    data?.pages.flatMap(page => page.items) ?? [], 
  [data]);

  const handleRowClick = (id: string) => {
    navigate(`/adoption/${id}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-[#0D162B] tracking-tight">
            Approval Queue
          </h1>
          <p className="mt-2 text-gray-500 font-medium">
            Manage and monitor multi-party adoption approvals
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            {/* Shelter Dropdown */}
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Search size={14} /> Shelter
              </label>
              <div className="relative">
                <select
                  value={shelterFilter}
                  onChange={(e) => setShelterFilter(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-[#0D162B] appearance-none focus:ring-2 focus:ring-[#E84D2A]/20 focus:border-[#E84D2A] transition-all outline-none"
                >
                  <option value="">All Shelters</option>
                  <option value="happy-paws">Happy Paws Shelter</option>
                  <option value="rescue-league">Rescue League</option>
                  <option value="city-animal-center">City Animal Center</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>

            {/* Status Chips */}
            <div className="flex-[2] space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Filter size={14} /> Status
              </label>
              <StatusFilterChips
                options={STATUS_OPTIONS}
                value={statusFilters}
                onChange={setStatusFilters}
              />
            </div>

            {/* Overdue Toggle */}
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 cursor-pointer select-none"
                 onClick={() => setShowOverdueOnly(!showOverdueOnly)}>
              <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${showOverdueOnly ? 'bg-[#E84D2A]' : 'bg-gray-300'}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${showOverdueOnly ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
              <span className="text-sm font-bold text-[#0D162B]">Show overdue only</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="p-0">
              <Skeleton variant="row" className="h-16 border-b" lines={8} />
            </div>
          ) : isError ? (
            <div className="py-20">
              <EmptyState
                title="Something went wrong"
                description="Failed to load approval queue. Please try again."
                action={{
                  label: "Retry",
                  onClick: () => refetch()
                }}
              />
            </div>
          ) : allItems.length === 0 ? (
            <div className="py-20 text-center">
              <EmptyState
                title={showOverdueOnly ? "No overdue approvals" : "Queue is empty"}
                description={
                  showOverdueOnly 
                    ? "Great job! All pending approvals are within their SLA."
                    : "There are currently no adoption applications in the queue."
                }
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Shelter</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Pet</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Adopter</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Submitted</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Shelter Approval</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Waiting</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">SLA Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {allItems.map((item) => (
                      <tr 
                        key={item.id}
                        onClick={() => handleRowClick(item.id)}
                        className="hover:bg-[#FFF2E5]/30 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-5 font-semibold text-[#0D162B] text-sm">{item.shelter}</td>
                        <td className="px-6 py-5 font-semibold text-[#0D162B] text-sm">{item.pet}</td>
                        <td className="px-6 py-5">
                           <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                               {item.adopter.charAt(0)}
                             </div>
                             <span className="font-semibold text-[#0D162B] text-sm">{item.adopter}</span>
                           </div>
                        </td>
                        <td className="px-6 py-5 text-gray-500 text-sm">
                          {new Date(item.submitted).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-5">
                          {item.shelterApproved ? (
                            <div className="inline-flex items-center gap-1 text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded-md">
                              <CheckCircle2 size={12} /> Approved
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 text-gray-400 font-bold text-xs bg-gray-50 px-2 py-1 rounded-md">
                               <Clock size={12} /> Pending
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-5">
                           <span className={`text-sm font-bold ${item.daysWaiting > 3 ? 'text-red-500' : 'text-[#0D162B]'}`}>
                             {item.daysWaiting}d
                           </span>
                        </td>
                        <td className="px-6 py-5">
                          {item.isOverdue ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white bg-[#E84D2A] rounded-full shadow-sm shadow-[#E84D2A]/20">
                              <AlertCircle size={12} strokeWidth={3} />
                              SLA Breached
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-100 rounded-full">
                               On Track
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Load More */}
              {hasNextPage && (
                <div className="p-6 border-t border-gray-50 flex justify-center">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-[#0D162B] hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isFetchingNextPage ? (
                      <>
                         <div className="w-4 h-4 border-2 border-gray-200 border-t-[#E84D2A] rounded-full animate-spin" />
                         Loading...
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
