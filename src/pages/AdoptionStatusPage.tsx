import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAdoptionStatus } from "../features/adoption/hooks/useAdoptionStatus";
import { AdoptionTimeline } from "../features/adoption/components/AdoptionTimeline";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/emptyState";

/**
 * AdoptionStatusPage
 *
 * Live view of a single adoption request. Polls the existing status endpoint
 * every 30 s via `useAdoptionStatus` (polling stops once the status is
 * terminal) and renders the inquiry → review → approved → completed
 * timeline from the issue-39 `statusConfig`.
 *
 * A rejected request surfaces the backend-supplied decision reason.
 */
export default function AdoptionStatusPage() {
  const { adoptionId } = useParams<{ adoptionId: string }>();
  const {
    data,
    isLoading,
    isError,
    isForbidden,
    isNotFound,
    isTerminal,
    statusConfig,
    refetch,
  } = useAdoptionStatus(adoptionId ?? "");

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-8" data-testid="status-loading">
        <div className="mb-8 space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="space-y-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="row" className="h-12" />
          ))}
        </div>
      </div>
    );
  }

  if (isForbidden) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <EmptyState
          title="You do not have access to this adoption"
          description="Only the adopter or the shelter can view this adoption's status."
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <EmptyState
          title="Adoption not found"
          description={`No adoption exists with id #${adoptionId?.slice(0, 8) ?? ""}.`}
        />
      </div>
    );
  }

  if (isError || !data || !statusConfig) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <EmptyState
          title="Error loading adoption status"
          description="Failed to fetch the adoption status. Please try again later."
          action={{ label: "Retry", onClick: refetch }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/interests"
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Interests
        </Link>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Adoption Status
        </h1>
        <p className="text-gray-600">
          Track the progress of adoption #{adoptionId?.slice(0, 8)}
        </p>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        {/* Current status summary */}
        <div
          className="mb-6 flex items-center justify-between rounded-lg bg-gray-50 p-4"
          data-testid="status-summary"
        >
          <div>
            <p className="text-sm text-gray-500">Current status</p>
            <p className="text-lg font-semibold text-gray-900">
              {statusConfig.label}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              statusConfig.tone === "success"
                ? "bg-green-100 text-green-700"
                : statusConfig.tone === "danger"
                  ? "bg-red-100 text-red-700"
                  : statusConfig.tone === "warning"
                    ? "bg-amber-100 text-amber-700"
                    : statusConfig.tone === "neutral"
                      ? "bg-gray-100 text-gray-700"
                      : "bg-blue-100 text-blue-700"
            }`}
          >
            {isTerminal ? "Final" : "In progress"}
          </span>
        </div>

        {/* Rejection reason lives inside the timeline when rejected */}
        <AdoptionTimeline
          status={data.status}
          decisionReason={data.decisionReason ?? null}
        />

        {/* Polling indicator */}
        {!isTerminal && (
          <p
            className="mt-6 text-sm text-gray-400"
            data-testid="polling-indicator"
          >
            Auto-refreshes every 30 seconds until the adoption reaches a final
            status.
          </p>
        )}
      </div>
    </div>
  );
}
