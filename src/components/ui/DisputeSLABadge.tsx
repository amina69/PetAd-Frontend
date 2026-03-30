import type { DisputeStatus } from '../../types/dispute';

interface DisputeSLABadgeProps {
  createdAt: string;
  status: DisputeStatus | string;
}

/**
 * Badge showing SLA status based on dispute age.
 * - Red "SLA breached" if > 72h
 * - Amber "Due soon" if 48h-72h
 * - Hidden if resolved, closed or < 48h
 */
export function DisputeSLABadge({ createdAt, status }: DisputeSLABadgeProps) {
  // If resolved or closed, never show the SLA badge
  if (status === 'resolved' || status === 'closed') {
    return null;
  }

  const now = new Date();
  const created = new Date(createdAt);
  
  // Basic validation for invalid dates
  if (isNaN(created.getTime())) {
    return null;
  }

  const diffMs = now.getTime() - created.getTime();
  const hoursElapsed = Math.floor(diffMs / (1000 * 60 * 60));

  // SLA tracking only starts at 48 hours
  if (hoursElapsed < 48) {
    return null;
  }

  let label = '';
  let textClass = '';
  let bgClass = '';

  if (hoursElapsed > 72) {
    label = 'SLA breached';
    textClass = 'text-red-700';
    bgClass = 'bg-red-100';
  } else {
    label = 'Due soon';
    textClass = 'text-amber-700';
    bgClass = 'bg-amber-100';
  }

  return (
    <div className="relative group inline-block" id={`sla-badge-${createdAt}`}>
      <span
        className={`px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full ${textClass} ${bgClass}`}
      >
        {label}
      </span>

      {/* Basic Tooltip using peer/group hover pattern matching existing project components */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50 transition-opacity duration-200">
        <div className="rounded bg-gray-900/95 backdrop-blur-sm text-white text-[10px] px-2 py-1 whitespace-nowrap shadow-xl border border-white/10">
          {hoursElapsed} hours elapsed
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-gray-900/95" />
        </div>
      </div>
    </div>
  );
}
