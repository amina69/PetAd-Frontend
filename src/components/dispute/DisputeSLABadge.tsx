import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";

interface DisputeSLABadgeProps {
	deadlineAt: string;
	now?: Date;
}

function getRemainingHours(deadlineAt: string, now: Date): number {
	return Math.ceil((new Date(deadlineAt).getTime() - now.getTime()) / (1000 * 60 * 60));
}

export function DisputeSLABadge({ deadlineAt, now = new Date() }: DisputeSLABadgeProps) {
	const hoursRemaining = getRemainingHours(deadlineAt, now);

	let label = "On track";
	let className = "bg-emerald-100 text-emerald-800";
	let Icon = CheckCircle2;

	if (hoursRemaining <= 0) {
		label = "SLA breached";
		className = "bg-rose-100 text-rose-800";
		Icon = AlertTriangle;
	} else if (hoursRemaining <= 24) {
		label = `${hoursRemaining}h remaining`;
		className = "bg-amber-100 text-amber-800";
		Icon = Clock3;
	} else {
		label = `${hoursRemaining}h remaining`;
	}

	return (
		<span
			className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${className}`}
		>
			<Icon size={14} />
			{label}
		</span>
	);
}