import { useParams } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { useDisputeDetail } from "../../hooks/useDisputeDetail";
import { DisputeInfoSection } from "../../components/dispute/DisputeInfoSection";
import { DisputeResolutionSection } from "../../components/dispute/DisputeResolutionSection";
import { DisputeThread } from "../../components/dispute/DisputeThread";
import { SkeletonLoader } from "../../components/loaders/SkeletonLoader";

function DisputeErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      data-testid="dispute-detail-error"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-red-200 bg-red-50 px-6 py-12 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500">
        <RefreshCw size={20} aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-gray-900">
          Failed to load this dispute
        </p>
        <p className="text-xs text-gray-500">
          Something went wrong while fetching the dispute. Please try again.
        </p>
      </div>
      <button
        type="button"
        data-testid="dispute-detail-retry"
        onClick={onRetry}
        className="mt-1 inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
      >
        <RefreshCw size={14} aria-hidden="true" />
        Retry
      </button>
    </div>
  );
}

export function DisputeDetailPage() {
  const { disputeId } = useParams<{ disputeId: string }>();
  const { data, isLoading, isError, isNotFound, refetch } = useDisputeDetail(
    disputeId || "",
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <>
          <div className="bg-white shadow rounded-lg p-6">
            <SkeletonLoader />
          </div>
          {/* Render the thread while loading so its composer keeps a stable
              position once comments arrive (B12 acceptance criterion). */}
          <DisputeThread isLoading />
        </>
      );
    }

    if (isError && !isNotFound) {
      return <DisputeErrorState onRetry={() => void refetch()} />;
    }

    if (!data) {
      return (
        <div
          role="alert"
          data-testid="dispute-not-found"
          className="bg-red-50 text-red-600 p-4 rounded-md"
        >
          Dispute not found.
        </div>
      );
    }

    return (
      <>
        <DisputeInfoSection dispute={data} />
        <DisputeThread comments={data.comments ?? []} />
        <DisputeResolutionSection dispute={data} />
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dispute Details</h1>
        {renderContent()}
      </div>
    </div>
  );
}

export default DisputeDetailPage;
