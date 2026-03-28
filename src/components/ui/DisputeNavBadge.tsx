
import { useDisputeCount } from "../../hooks/useDisputeCount";

interface DisputeNavBadgeProps {
  currentUserId?: string;
}


export function DisputeNavBadge({ currentUserId }: DisputeNavBadgeProps) {
  const { displayCount } = useDisputeCount(currentUserId);

  if (!displayCount) return null;

  return (
    <span
      data-testid="dispute-nav-badge"
      aria-label={`${displayCount} active disputes`}
      className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full"
    >
      {displayCount}
    </span>
  );
}
