import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { TimelineEntry } from "../components/ui/TimelineEntry";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/emptyState";
import type { DisputeDetails, DisputeEvent } from "../types/dispute";
import type { AdoptionTimelineEntry } from "../types/adoption";

// Helper to map backend DisputeEvent to TimelineEntry props
const mapDisputeEventToTimelineEntry = (event: DisputeEvent): AdoptionTimelineEntry => {
  const entry: AdoptionTimelineEntry = {
    id: event.id,
    adoptionId: event.disputeId, // Using disputeId for uniqueness/referencing
    timestamp: event.createdAt,
    sdkEvent: event.type,
    message: event.message || `Dispute ${event.type.toLowerCase()}`,
    actor: event.actor,
    actorRole: event.actorRole,
  };

  if (event.type === "RAISED" && event.sdkPauseConfirmed) {
    entry.escrowPaused = true;
  }

  if (event.type === "RESOLVED" && event.resolutionTxHash) {
    entry.sdkTxHash = event.resolutionTxHash;
  }

  return entry;
};

// Mock data fetcher for demonstration since useDispute API hook isn't implemented
const useDisputeMock = (disputeId: string) => {
  const mockData: DisputeDetails = {
    id: disputeId,
    adoptionId: "adopt_123",
    status: "resolved",
    reason: "Item not as described",
    description: "Buyer reported issues with the pet’s condition after adoption.",
    createdAt: "2026-03-25T10:00:00Z",
    updatedAt: "2026-03-28T10:00:00Z",
    events: [
      {
        id: "ev_1",
        disputeId,
        type: "RAISED",
        createdAt: "2026-03-25T10:00:00Z",
        message: "Buyer raised a dispute",
        actor: "Alice",
        actorRole: "Adopter",
        sdkPauseConfirmed: true,
      },
      {
        id: "ev_2",
        disputeId,
        type: "ESCALATED",
        createdAt: "2026-03-26T14:30:00Z",
        message: "Dispute escalated to admins",
      },
      {
        id: "ev_3",
        disputeId,
        type: "RESOLVED",
        createdAt: "2026-03-28T10:00:00Z",
        message: "Dispute resolved by admin, funds separated",
        actor: "AdminBob",
        actorRole: "Admin",
        resolutionTxHash: "4b97148c34f37df26a9ece0cf7a30c501fbb8918fd3fdeb0a02cbdb8ff3fae32",
      },
    ]
  };

  return {
    data: mockData,
    isLoading: false,
    isError: false,
  };
};

export default function DisputeDetailPage() {
  const { disputeId } = useParams<{ disputeId: string }>();
  // Replace with actual useDispute(disputeId) when API is ready
  const { data: dispute, isLoading, isError } = useDisputeMock(disputeId || "mock_1");

  const timelineEntries = useMemo(() => {
    if (!dispute?.events) return [];
    // Map events and ensure they are sorted descending by time
    return [...dispute.events]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(mapDisputeEventToTimelineEntry);
  }, [dispute]);

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <EmptyState
          title="Error loading dispute"
          description="Failed to fetch dispute details. Please try again later."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to={`/disputes`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Disputes
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dispute Detail</h1>
        <p className="text-gray-600">Dispute #{disputeId?.slice(0, 8) || "Unknown"}</p>
      </div>

      <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>

        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="row" className="h-20" />
            ))}
          </div>
        ) : timelineEntries.length === 0 ? (
          <EmptyState
            title="No events yet"
            description="This dispute doesn't have any timeline events yet."
          />
        ) : (
          <div className="space-y-8">
            <ul className="relative">
              {/* Vertical line connecting entries */}
              <div className="absolute top-0 bottom-0 left-8 w-px bg-gray-200" aria-hidden="true" />
              
              {timelineEntries.map((entry, index) => {
                const isLatest = index === 0;
                
                return (
                  <div 
                    key={`${entry.timestamp}-${index}`} 
                    className={`relative z-10 ${isLatest ? 'rounded-lg ring-1 ring-orange-200 bg-orange-50/50' : ''}`}
                    data-testid={`timeline-entry${isLatest ? '-latest' : ''}`}
                  >
                    <TimelineEntry entry={entry} />
                  </div>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
