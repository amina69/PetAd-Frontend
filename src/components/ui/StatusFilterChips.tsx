import type { AdoptionStatus } from "../../types/adoption";

interface StatusFilterChipsProps {
  options: AdoptionStatus[];
  selectedStatuses: AdoptionStatus[];
  counts?: Partial<Record<AdoptionStatus, number>>;
  onToggle: (status: AdoptionStatus) => void;
}

const STATUS_LABELS: Record<AdoptionStatus, string> = {
  ESCROW_CREATED: "Escrow Created",
  ESCROW_FUNDED: "Escrow Funded",
  SETTLEMENT_TRIGGERED: "Settlement Triggered",
  DISPUTED: "Disputed",
  FUNDS_RELEASED: "Funds Released",
  CUSTODY_ACTIVE: "Custody Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function formatAdoptionStatusLabel(status: AdoptionStatus) {
  return STATUS_LABELS[status];
}

export function StatusFilterChips({
  options,
  selectedStatuses,
  counts,
  onToggle,
}: StatusFilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-3" aria-label="Adoption status filters">
      {options.map((status) => {
        const isActive = selectedStatuses.includes(status);
        const count = counts?.[status];
        const label = formatAdoptionStatusLabel(status);
        const chipLabel = isActive && typeof count === "number" ? `${label} (${count})` : label;

        return (
          <button
            key={status}
            type="button"
            onClick={() => onToggle(status)}
            aria-pressed={isActive}
            className={[
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-[#E84D2A] bg-[#FFF1ED] text-[#B93815]"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:text-gray-900",
            ].join(" ")}
          >
            {chipLabel}
          </button>
        );
      })}
    </div>
  );
}
