import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Info,
  MinusCircle,
  ShieldAlert,
} from "lucide-react";

type EscrowStatus =
  | "CREATED"
  | "FUNDED"
  | "CONFIRMED"
  | "SETTLING"
  | "SETTLED"
  | "SETTLEMENT_FAILED"
  | "DISPUTED"
  | "NOT_FOUND";

interface EscrowStatusBadgeProps {
  status: string;
}

const STATUS_ICONS: Record<string, ReactNode> = {
  gray: <MinusCircle aria-hidden="true" className="h-3.5 w-3.5" />,
  blue: <Info aria-hidden="true" className="h-3.5 w-3.5" />,
  teal: <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />,
  green: <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />,
  amber: <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />,
  red: <ShieldAlert aria-hidden="true" className="h-3.5 w-3.5" />,
};

const STATUS_CONFIG: Record<
  EscrowStatus,
  { label: string; color: string; icon: string; description: string }
> = {
  CREATED: {
    label: "Created",
    color: "bg-gray-100 text-gray-700",
    icon: "gray",
    description: "Escrow has been created but not yet funded.",
  },
  FUNDED: {
    label: "Funded",
    color: "bg-blue-100 text-blue-700",
    icon: "blue",
    description: "Funds have been deposited into escrow.",
  },
  CONFIRMED: {
    label: "Confirmed",
    color: "bg-teal-100 text-teal-700",
    icon: "teal",
    description: "Transaction has been confirmed by the parties.",
  },
  SETTLING: {
    label: "Settling",
    color: "bg-amber-100 text-amber-700",
    icon: "amber",
    description: "Funds are currently being processed for settlement.",
  },
  SETTLED: {
    label: "Settled",
    color: "bg-green-100 text-green-700",
    icon: "green",
    description: "Escrow has been successfully settled.",
  },
  SETTLEMENT_FAILED: {
    label: "Settlement Failed",
    color: "bg-red-100 text-red-700",
    icon: "red",
    description: "Settlement failed. Funds were not successfully transferred.",
  },
  DISPUTED: {
    label: "Disputed",
    color: "bg-red-100 text-red-700",
    icon: "red",
    description: "A dispute has been raised for this escrow.",
  },
  NOT_FOUND: {
    label: "Not Found",
    color: "bg-gray-100 text-gray-700",
    icon: "gray",
    description: "Escrow record could not be found.",
  },
};

export function EscrowStatusBadge({ status }: EscrowStatusBadgeProps) {
  const config = STATUS_CONFIG[status as EscrowStatus] || STATUS_CONFIG.NOT_FOUND;

  return (
    <div className="group relative inline-flex">
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-medium ${config.color}`}
      >
        <span className="inline-flex" data-testid="status-badge-icon">
          {STATUS_ICONS[config.icon]}
        </span>
        {config.label}
      </span>

      <div className="absolute left-1/2 top-full z-10 mt-2 w-max max-w-[220px] -translate-x-1/2 scale-95 opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100">
        <div className="rounded-md bg-[#0F2236] px-3 py-2 text-[12px] text-white shadow-lg">
          {config.description}
        </div>
      </div>
    </div>
  );
}
