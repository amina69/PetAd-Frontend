import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock } from "lucide-react";

interface CustodyExpiringBannerProps {
  endDate: string;
  custodyId: string;
}

function computeTimeRemaining(endDate: string): { hours: number; minutes: number } {
  const msRemaining = new Date(endDate).getTime() - Date.now();
  if (msRemaining <= 0) return { hours: 0, minutes: 0 };
  const totalMinutes = Math.floor(msRemaining / (1000 * 60));
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}

function formatTimeRemaining(hours: number, minutes: number): string {
  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? "s" : ""}${minutes > 0 ? ` ${minutes} minute${minutes !== 1 ? "s" : ""}` : ""}`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }
  return "less than a minute";
}

export function CustodyExpiringBanner({ endDate, custodyId }: CustodyExpiringBannerProps) {
  const [timeRemaining, setTimeRemaining] = useState(() =>
    computeTimeRemaining(endDate),
  );

  useEffect(() => {
    setTimeRemaining(computeTimeRemaining(endDate));

    const intervalId = setInterval(() => {
      setTimeRemaining(computeTimeRemaining(endDate));
    }, 60_000);

    return () => clearInterval(intervalId);
  }, [endDate]);

  const { hours, minutes } = timeRemaining;
  const expired = hours === 0 && minutes === 0;

  if (expired) {
    return null;
  }

  return (
    <div
      className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-950"
      data-testid="custody-expiring-banner"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Clock
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-amber-600"
          size={18}
        />
        <div className="flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
            Custody Expiring Soon
          </p>
          <p className="mt-2 text-lg font-semibold">
            This custody period ends in{" "}
            <span data-testid="custody-time-remaining">
              {formatTimeRemaining(hours, minutes)}
            </span>
            .
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Complete the adoption process before time runs out.{" "}
            <Link
              className="font-semibold underline underline-offset-2 hover:text-amber-950"
              data-testid="custody-expiring-action-link"
              to={`/custody/${custodyId}/complete`}
            >
              Complete now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
