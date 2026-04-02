import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  /** ISO 8601 date string representing the approval expiry time. */
  expiresAt: string;
}

interface TimeRemaining {
  hours: number;
  minutes: number;
  expired: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeTimeRemaining(expiresAt: string): TimeRemaining {
  const diffMs = new Date(expiresAt).getTime() - Date.now();

  if (diffMs <= 0) {
    return { hours: 0, minutes: 0, expired: true };
  }

  const totalMinutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return { hours, minutes, expired: false };
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Displays a countdown to an approval expiry date, updating every 60 seconds.
 *
 * - **Default** (> 24 h): slate text
 * - **Warning** (≤ 24 h, > 1 h): amber text
 * - **Urgent** (≤ 1 h, not expired): red text + alert icon
 * - **Expired**: red "Expired" label, timer stopped
 */
export function ApprovalExpiryCountdown({ expiresAt }: Props) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() =>
    computeTimeRemaining(expiresAt),
  );

  useEffect(() => {
    // If already expired on mount, no need to start the interval.
    if (timeRemaining.expired) return;

    const id = setInterval(() => {
      const next = computeTimeRemaining(expiresAt);
      setTimeRemaining(next);

      // Stop the interval once expired to avoid unnecessary ticks.
      if (next.expired) clearInterval(id);
    }, 60_000);

    return () => clearInterval(id);
  }, [expiresAt]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Expired ──────────────────────────────────────────────────────────────────
  if (timeRemaining.expired) {
    return (
      <span
        data-testid="approval-expiry-countdown"
        className="text-red-500 font-medium"
      >
        Expired
      </span>
    );
  }

  const { hours, minutes } = timeRemaining;
  const totalHours = hours + minutes / 60;

  // ── Determine urgency tier ────────────────────────────────────────────────────
  const isUrgent = totalHours < 1;
  const isWarning = !isUrgent && totalHours <= 24;

  const colorClass = isUrgent
    ? "text-red-500"
    : isWarning
      ? "text-amber-500"
      : "text-slate-600";

  const label =
    hours > 0
      ? `${hours}h ${minutes}m remaining`
      : `${minutes}m remaining`;

  return (
    <span
      data-testid="approval-expiry-countdown"
      className={`inline-flex items-center gap-1 font-medium ${colorClass}`}
    >
      {isUrgent && (
        <AlertCircle
          data-testid="urgency-icon"
          size={16}
          aria-hidden="true"
        />
      )}
      {label}
    </span>
  );
}
