import type { DisputeStatus } from "../../types/dispute";

interface DisputeStatusBadgeProps {
	status: DisputeStatus;
}

const STATUS_STYLES: Record<DisputeStatus, { label: string; className: string }> = {
	OPEN: {
		label: "Open",
		className: "bg-amber-100 text-amber-800",
	},
	UNDER_REVIEW: {
		label: "Under Review",
		className: "bg-sky-100 text-sky-800",
	},
	RESOLVED: {
		label: "Resolved",
		className: "bg-emerald-100 text-emerald-800",
	},
	CLOSED: {
		label: "Closed",
		className: "bg-slate-200 text-slate-700",
	},
};

export function DisputeStatusBadge({ status }: DisputeStatusBadgeProps) {
	const config = STATUS_STYLES[status];

	return (
		<span
			className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}
		>
			{config.label}
		</span>
	);
}