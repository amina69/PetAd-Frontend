import { useAdoptionApprovals } from "../../hooks/useAdoptionApprovals";

interface ApprovalStatusExampleProps {
  adoptionId: string;
}

/**
 * Example component demonstrating useAdoptionApprovals hook usage.
 * Shows approval progress and automatically updates via polling until quorum is met.
 */
export function ApprovalStatusExample({ adoptionId }: ApprovalStatusExampleProps) {
  const approvals = useAdoptionApprovals(adoptionId);

  if (approvals.isLoading) {
    return <div>Loading approval status...</div>;
  }

  if (approvals.isError) {
    return <div>Error loading approvals</div>;
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Approval Status</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Approvals Received:</span>
          <span className="font-medium">
            {approvals.given} / {approvals.required}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Pending:</span>
          <span className="font-medium">{approvals.pending}</span>
        </div>

        <div className="flex justify-between">
          <span>Quorum Status:</span>
          <span className={approvals.quorumMet ? "text-green-600" : "text-yellow-600"}>
            {approvals.quorumMet ? "✓ Met" : "⏳ Pending"}
          </span>
        </div>

        {approvals.quorumMet && approvals.escrowAccountId && (
          <div className="mt-4 p-2 bg-green-50 rounded">
            <div className="text-sm font-medium text-green-800">
              Escrow Account Created
            </div>
            <div className="text-xs text-green-600 font-mono mt-1 break-all">
              {approvals.escrowAccountId}
            </div>
          </div>
        )}

        {!approvals.quorumMet && (
          <div className="mt-4 text-sm text-gray-500">
            Polling for updates every 30 seconds...
          </div>
        )}
      </div>
    </div>
  );
}
