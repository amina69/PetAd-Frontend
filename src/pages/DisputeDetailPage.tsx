import { useParams } from "react-router-dom";
import { DisputeResolutionSection } from "../components/dispute/DisputeResolutionSection";

export default function DisputeDetailPage() {
  const { id } = useParams();

  // TODO: Fetch dispute data using id
  // For now, mock data
  const dispute = {
    id: id || "dispute-001",
    status: "RESOLVED" as const,
    resolution: {
      type: "SPLIT" as const,
      adminNote: "After reviewing the evidence, a split resolution was deemed fair.",
      resolvedBy: "admin@example.com",
      resolvedAt: "2026-03-25T14:30:00.000Z",
      resolutionTxHash: "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
      distribution: [
        { recipient: "Shelter", amount: "50.00", percentage: 50 },
        { recipient: "Adopter", amount: "50.00", percentage: 50 },
      ],
    },
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Dispute Details
        </h1>

        {/* Dispute basic info would go here */}

        <DisputeResolutionSection dispute={dispute} />
      </div>
    </div>
  );
}