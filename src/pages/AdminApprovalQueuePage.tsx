import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  Search, 
  Filter, 
  ChevronDown, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  MoreHorizontal
} from "lucide-react";
import type { AdminApprovalQueueItem } from "../features/approval/schemas/approvalSchemas";
import { useAdminApplications } from "../hooks/useAdminApplications";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [shelterFilter, setShelterFilter] = useState("");
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AdminApprovalQueueItem | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const statusFilters = useMemo(
    () => searchParams.get("status")?.split(",").filter(Boolean) ?? [],
    [searchParams],
  );
  const rawType = searchParams.get("type");
  const applicationType =
    rawType === "ADOPTION" || rawType === "CUSTODY" ? rawType : "";
  const rawAge = Number(searchParams.get("olderThanDays"));
  const olderThanDays = Number.isFinite(rawAge) && rawAge > 0 ? rawAge : undefined;

  const updateUrlFilter = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) nextParams.set(key, value);
    else nextParams.delete(key);
    setSearchParams(nextParams, { replace: true });
  };

  const updateStatusFilters = (values: string[]) =>
    updateUrlFilter("status", values.join(","));

  const {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    applications: allItems,
    decide,
    isDeciding,
  } = useAdminApplications({
        shelter: shelterFilter || undefined,
        status: statusFilters.join(",") || undefined,
        type: applicationType || undefined,
        olderThanDays,
        overdueOnly: showOverdueOnly,
      });

  const handleDecision = async (decision: "approve" | "reject") => {
    if (!selectedItem) return;
    setDecisionError(null);
    try {
      await decide({ applicationId: selectedItem.id, decision });
      setSelectedItem(null);
    } catch (error) {
      setDecisionError(
        error instanceof Error ? error.message : "Unable to update this application.",
      );
    }
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
            Review adoption and custody applications and their risk flags
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
                onChange={updateStatusFilters}
              />
            </div>

            <div className="flex-1 space-y-2">
              <label htmlFor="application-type" className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Application type
              </label>
              <select
                id="application-type"
                value={applicationType}
                onChange={(event) => updateUrlFilter("type", event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-[#0D162B]"
              >
                <option value="">All types</option>
                <option value="ADOPTION">Adoption</option>
                <option value="CUSTODY">Custody</option>
              </select>
            </div>

            <div className="flex-1 space-y-2">
              <label htmlFor="older-than-days" className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Age
              </label>
              <select
                id="older-than-days"
                value={olderThanDays?.toString() ?? ""}
                onChange={(event) => updateUrlFilter("olderThanDays", event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-[#0D162B]"
              >
                <option value="">Any age</option>
                {[3, 7, 14, 30].map((days) => (
                  <option key={days} value={days}>Older than {days} days</option>
                ))}
              </select>
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
                    : "There are currently no applications in the queue."
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
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Risk</th>
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
                        onClick={() => {
                          setDecisionError(null);
                          setSelectedItem(item);
                        }}
                        tabIndex={0}
                        role="button"
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setDecisionError(null);
                            setSelectedItem(item);
                          }
                        }}
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
                        <td className="px-6 py-5 text-sm text-gray-600">
                          {item.type === "CUSTODY" ? "Custody" : "Adoption"}
                        </td>
                        <td className="px-6 py-5 text-sm">
                          {item.flaggedRisk ? (
                            <span className="font-semibold text-red-600">Flagged</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
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

      {selectedItem && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isDeciding) {
              setSelectedItem(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-review-title"
            className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {selectedItem.type === "CUSTODY" ? "Custody" : "Adoption"} application
                </p>
                <h2 id="application-review-title" className="mt-1 text-xl font-bold text-gray-900">
                  {selectedItem.pet}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                disabled={isDeciding}
                aria-label="Close application details"
                className="rounded-lg px-3 py-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                Close
              </button>
            </div>
            <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase text-gray-500">Applicant</dt>
                <dd className="mt-1 text-sm text-gray-900">{selectedItem.adopter}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-gray-500">Shelter</dt>
                <dd className="mt-1 text-sm text-gray-900">{selectedItem.shelter}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-gray-500">Submitted</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(selectedItem.submitted).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-gray-500">Current status</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {selectedItem.status ?? (selectedItem.shelterApproved ? "SHELTER_APPROVED" : "PENDING")}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-gray-500">Application ID</dt>
                <dd className="mt-1 break-all text-sm text-gray-900">{selectedItem.id}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-gray-500">Risk review</dt>
                <dd className={`mt-1 text-sm font-semibold ${selectedItem.flaggedRisk ? "text-red-700" : "text-green-700"}`}>
                  {selectedItem.flaggedRisk ? "Flagged for review" : "No risk flag"}
                </dd>
              </div>
            </dl>
            {decisionError && (
              <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {decisionError}
              </p>
            )}
            <div className="mt-7 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => void handleDecision("reject")}
                disabled={isDeciding}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => void handleDecision("approve")}
                disabled={isDeciding}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {isDeciding ? "Saving…" : "Approve"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
