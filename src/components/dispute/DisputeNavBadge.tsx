import { useDisputeCount } from "../../lib/hooks/useDisputeCount";

export function DisputeNavBadge() {
  const { count, displayCount } = useDisputeCount();

  if (count === 0) return null;

  return (
    <span
      aria-label={`${count} active ${count === 1 ? "dispute" : "disputes"}`}
      className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none"
    >
      {displayCount}
    </span>
  );
}