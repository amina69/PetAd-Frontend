import { usePreferences } from "../hooks/usePreferences";
import type { NotificationPreferenceType } from "../../../types/notifications";

interface PreferenceRow {
  type: NotificationPreferenceType;
  label: string;
  description: string;
}

/** One row per `NotificationPreferenceType`, in display order. */
export const PREFERENCE_ROWS: PreferenceRow[] = [
  {
    type: "APPROVAL_REQUESTED",
    label: "Approval requested",
    description: "An adoption request is waiting for your review.",
  },
  {
    type: "ESCROW_FUNDED",
    label: "Escrow funded",
    description: "Funds for an adoption have landed in escrow.",
  },
  {
    type: "SETTLEMENT_COMPLETE",
    label: "Settlement complete",
    description: "Escrow funds have been released to every party.",
  },
  {
    type: "DISPUTE_RAISED",
    label: "Dispute raised",
    description: "Someone opened a dispute on one of your adoptions.",
  },
  {
    type: "DOCUMENT_EXPIRING",
    label: "Document expiring",
    description: "A required document is about to expire.",
  },
  {
    type: "CUSTODY_EXPIRING",
    label: "Custody expiring",
    description: "A temporary custody period is about to end.",
  },
];

/**
 * C29. Per-type notification toggles.
 *
 * Toggles update optimistically; a failed save reverts the toggle and shows
 * an inline error on that row.
 *
 * @see https://github.com/amina69/PetAd-Frontend/issues/624
 */
export function NotificationPreferences() {
  const { preferences, isLoading, isError, pendingTypes, failedTypes, setPreference } =
    usePreferences();

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Loading notification preferences"
        className="space-y-3 rounded-xl border border-gray-200 bg-white p-4"
      >
        {PREFERENCE_ROWS.map((row) => (
          <div key={row.type} className="h-10 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  if (isError || !preferences) {
    return (
      <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        We couldn't load your notification preferences. Please try again later.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
      {PREFERENCE_ROWS.map(({ type, label, description }) => {
        const enabled = preferences[type];
        const isPending = pendingTypes.has(type);
        const hasFailed = failedTypes.has(type);
        const labelId = `notification-pref-${type}-label`;
        const descriptionId = `notification-pref-${type}-description`;
        const errorId = `notification-pref-${type}-error`;

        return (
          <li key={type} className="flex items-start justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p id={labelId} className="text-sm font-medium text-gray-900">
                {label}
              </p>
              <p id={descriptionId} className="text-xs text-gray-500">
                {description}
              </p>
              {hasFailed && (
                <p id={errorId} role="alert" className="mt-1 text-xs font-medium text-red-600">
                  Couldn't save this change. Please try again.
                </p>
              )}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-labelledby={labelId}
              aria-describedby={hasFailed ? `${descriptionId} ${errorId}` : descriptionId}
              aria-busy={isPending}
              disabled={isPending}
              data-testid={`notification-pref-${type}`}
              onClick={() => setPreference(type, !enabled)}
              className={[
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2",
                "disabled:cursor-wait disabled:opacity-70",
                enabled ? "bg-orange-500" : "bg-gray-300",
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className={[
                  "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
                  enabled ? "translate-x-6" : "translate-x-1",
                ].join(" ")}
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
