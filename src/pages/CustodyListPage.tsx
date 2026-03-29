import { useState } from "react";
import { Link } from "react-router-dom";
import { StatusFilterChips, type Option } from "../components/ui/StatusFilterChips";
import { useCustodyList } from "../hooks/useCustodyList";
import { CustodyStatusBadge } from "../components/custody/CustodyStatusBadge";
import type { CustodyStatus } from "../types/adoption";
import { Skeleton } from "../components/ui/Skeleton";

// Define custody status options for filter
const CUSTODY_STATUS_OPTIONS: Option[] = [
  { value: "PENDING", label: "Pending" },
  { value: "DEPOSIT_PENDING", label: "Deposit Pending" },
  { value: "DEPOSIT_CONFIRMED", label: "Deposit Confirmed" },
  { value: "ACTIVE", label: "Active" },
  { value: "EXPIRING_SOON", label: "Expiring Soon" },
  { value: "COMPLETING", label: "Completing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "DISPUTED", label: "Disputed" },
  { value: "CANCELLED", label: "Cancelled" },
];

// Special styling for EXPIRING_SOON to show amber highlight
const getFilterChipClassName = (value: string, isSelected: boolean) => {
  const baseClasses = "px-3 py-1 rounded-full text-sm transition";
  
  if (isSelected) {
    if (value === "EXPIRING_SOON") {
      return `${baseClasses} bg-amber-500 text-white border-2 border-amber-600`;
    }
    return `${baseClasses} bg-[#E84D2A] text-white`;
  }
  
  if (value === "EXPIRING_SOON") {
    return `${baseClasses} border-2 border-amber-500 text-amber-600 bg-white hover:bg-amber-50`;
  }
  
  return `${baseClasses} border border-[#E84D2A] text-[#E84D2A] bg-white hover:bg-[#FFF2E5]`;
};

export default function CustodyListPage() {
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const { data: custodyList, isLoading, isError } = useCustodyList({
    status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
  });

  const handleStatusChange = (statuses: string[]) => {
    setSelectedStatuses(statuses);
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        {/* Page Header */}
        <section className="rounded-[2rem] bg-slate-900 p-8 text-white shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
            Custody
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Custody List</h1>
          <p className="mt-2 text-sm text-slate-400">
            {custodyList?.length || 0} custody arrangements
          </p>
        </section>

        {/* Filters Section */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 mb-4">
            Filter by Status
          </p>
          <CustomStatusFilterChips
            options={CUSTODY_STATUS_OPTIONS}
            value={selectedStatuses}
            onChange={handleStatusChange}
          />
        </section>

        {/* Custody List */}
        <section
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          data-testid="custody-list-panel"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Custody Arrangements
          </p>

          {isLoading ? (
            <div className="mt-6 space-y-4" data-testid="custody-list-skeleton">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-slate-200 rounded-2xl p-4">
                  <Skeleton variant="row" className="rounded-xl mb-2" />
                  <Skeleton variant="row" className="rounded-xl w-3/4" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div
              className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900"
              data-testid="custody-list-error"
            >
              Unable to load custody list.
            </div>
          ) : !custodyList || custodyList.length === 0 ? (
            <div
              className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700"
              data-testid="custody-list-empty"
            >
              {selectedStatuses.length > 0
                ? "No custody arrangements found with the selected filters."
                : "No custody arrangements found."}
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {custodyList.map((custody) => (
                <div
                  key={custody.id}
                  className="border border-slate-200 rounded-2xl p-4 hover:border-slate-300 transition-colors"
                  data-testid={`custody-item-${custody.id}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900 truncate">
                          Custody #{custody.id}
                        </h3>
                        <CustodyStatusBadge status={custody.status} />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
                        <div>
                          <span className="font-medium">Pet ID:</span> {custody.petId}
                        </div>
                        <div>
                          <span className="font-medium">Custodian:</span> {custody.custodianId}
                        </div>
                        <div>
                          <span className="font-medium">Owner:</span> {custody.ownerId}
                        </div>
                        <div>
                          <span className="font-medium">Start Date:</span>{" "}
                          {new Date(custody.startDate).toLocaleDateString()}
                        </div>
                        {custody.endDate && (
                          <div>
                            <span className="font-medium">End Date:</span>{" "}
                            {new Date(custody.endDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/custody/${custody.id}/timeline`}
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
                      >
                        View Timeline
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

// Custom StatusFilterChips component with special styling for EXPIRING_SOON
interface CustomStatusFilterChipsProps {
  options: Option[];
  value?: string[];
  onChange?: (value: string[]) => void;
}

function CustomStatusFilterChips({
  options,
  value = [],
  onChange,
}: CustomStatusFilterChipsProps) {
  const toggle = (val: string) => {
    if (value.includes(val)) {
      onChange?.(value.filter((v) => v !== val));
    } else {
      onChange?.([...value, val]);
    }
  };

  const clearAll = () => onChange?.([]);

  return (
    <div className="flex flex-col gap-3">
      <div
        role="group"
        aria-label="Filter by status"
        className="flex flex-wrap gap-2"
      >
        {options.map((opt) => {
          const isSelected = value.includes(opt.value);

          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggle(opt.value)}
              className={getFilterChipClassName(opt.value, isSelected)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {value.length > 0 && (
        <button
          onClick={clearAll}
          className="text-sm text-[#E84D2A] underline w-fit"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
