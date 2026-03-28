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

const STATUS_CONFIG: Record<
    EscrowStatus,
    { label: string; color: string; description: string }
> = {
    CREATED: {
        label: "Created",
        color: "bg-gray-100 text-gray-700",
        description: "Escrow has been created but not yet funded.",
    },
    FUNDED: {
        label: "Funded",
        color: "bg-blue-100 text-blue-700",
        description: "Funds have been deposited into escrow.",
    },
    CONFIRMED: {
        label: "Confirmed",
        color: "bg-teal-100 text-teal-700",
        description: "Transaction has been confirmed by the parties.",
    },
    SETTLING: {
        label: "Settling",
        color: "bg-amber-100 text-amber-700",
        description: "Funds are currently being processed for settlement.",
    },
    SETTLED: {
        label: "Settled",
        color: "bg-green-100 text-green-700",
        description: "Escrow has been successfully settled.",
    },
    SETTLEMENT_FAILED: {
        label: "Settlement Failed",
        color: "bg-red-100 text-red-700",
        description: "Settlement failed. Funds were not successfully transferred.",
    },
    DISPUTED: {
        label: "Disputed",
        color: "bg-red-100 text-red-700",
        description: "A dispute has been raised for this escrow.",
    },
    NOT_FOUND: {
        label: "Not Found",
        color: "bg-gray-100 text-gray-700",
        description: "Escrow record could not be found.",
    },
};

export function EscrowStatusBadge({ status }: EscrowStatusBadgeProps) {
    const config =
        STATUS_CONFIG[status as EscrowStatus] || STATUS_CONFIG.NOT_FOUND;

    return (
        <div className="group relative inline-flex">
            <span
                className={`px-3 py-1 rounded-full text-[12px] font-medium ${config.color}`}
            >
                {config.label}
            </span>

            {/* Tooltip */}
            <div className="absolute left-1/2 top-full z-10 mt-2 w-max max-w-[220px] -translate-x-1/2 scale-95 opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100">
                <div className="rounded-md bg-[#0F2236] px-3 py-2 text-[12px] text-white shadow-lg">
                    {config.description}
                </div>
            </div>
        </div>
    );
}