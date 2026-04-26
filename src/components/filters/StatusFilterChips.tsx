import React from "react";
import type { AdoptionStatus } from "../../hooks/useAdoptionList";

export interface StatusFilterChipsProps {
  selectedStatuses: AdoptionStatus[];
  counts: Record<AdoptionStatus, number>;
  onChange: (statuses: AdoptionStatus[]) => void;
}

const STATUS_CONFIG: Record<AdoptionStatus, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200" },
  APPROVED: { label: "Approved", color: "bg-green-100 text-green-800 border-green-300 hover:bg-green-200" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-300 hover:bg-red-200" },
  DISPUTED: { label: "Disputed", color: "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200" },
};

const STATUS_KEYS: AdoptionStatus[] = ["PENDING", "APPROVED", "REJECTED", "DISPUTED"];

export const StatusFilterChips: React.FC<StatusFilterChipsProps> = ({
  selectedStatuses,
  counts,
  onChange,
}) => {
  const toggleStatus = (status: AdoptionStatus) => {
    if (selectedStatuses.includes(status)) {
      onChange(selectedStatuses.filter((s) => s !== status));
    } else {
      onChange([...selectedStatuses, status]);
    }
  };

  return (
    <div
      role="group"
      aria-label="Filter adoptions by status"
      className="flex flex-wrap gap-3 py-4"
    >
      {STATUS_KEYS.map((status) => {
        const isSelected = selectedStatuses.includes(status);
        const config = STATUS_CONFIG[status];
        const count = counts[status] || 0;

        return (
          <button
            key={status}
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            onClick={() => toggleStatus(status)}
            className={`
              relative flex items-center px-4 py-2 rounded-full border text-sm font-medium transition-colors
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              ${isSelected ? config.color : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}
            `}
          >
            {config.label}
            <span
              className={`
                ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold
                ${isSelected ? "bg-white bg-opacity-50" : "bg-gray-200 text-gray-500"}
              `}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
