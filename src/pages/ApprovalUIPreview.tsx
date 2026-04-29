import { useState } from "react";
import { MultiPartyApprovalUI } from "../components/approval/MultiPartyApprovalUI";
import { useAdoptionApprovals } from "../hooks/useAdoptionApprovals";
import { useMutateApprovalDecision } from "../hooks/useMutateApprovalDecision";
import { Check, X, Loader2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function ApprovalUIPreview() {
  const adoptionId = "adoption-1"; // Matches mock in adoptionHandlers
  const { required, given, pending, isLoading, isError } = useAdoptionApprovals(adoptionId);
  const { mutate: submitDecision, isPending } = useMutateApprovalDecision(adoptionId);

  const [reason, setReason] = useState("Information looks correct.");

  const handleDecision = (role: string, decision: 'APPROVED' | 'REJECTED') => {
    submitDecision(
      { role, decision, reason },
      {
        onSuccess: () => toast.success(`Decision submitted for ${role}`),
        onError: () => toast.error(`Failed to submit decision for ${role}`),
      }
    );
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500" /></div>;
  if (isError) return <div className="text-center p-12 text-red-500">Error loading approvals</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Toaster position="top-right" />
      <div className="max-w-xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Multi-party Approval UI</h1>
          <p className="text-gray-600">Testing the real hook and mutation with optimistic updates.</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">Approval Status List</h2>
          <MultiPartyApprovalUI 
            required={required}
            given={given}
            pending={pending}
          />
        </section>

        <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Submit Decision (Simulate)</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <input 
                  type="text" 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="Enter reason..."
                />
              </div>
              
              <div className="flex flex-wrap gap-3">
                {pending.map(role => (
                  <div key={role} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100 flex-1 min-w-[200px]">
                    <span className="text-xs font-bold text-gray-500 uppercase">{role}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleDecision(role, 'APPROVED')}
                        disabled={isPending}
                        className="flex-1 flex items-center justify-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button 
                        onClick={() => handleDecision(role, 'REJECTED')}
                        disabled={isPending}
                        className="flex-1 flex items-center justify-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
                {pending.length === 0 && <p className="text-sm text-gray-500 italic">No pending approvals left to simulate.</p>}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">Mutation Features:</h2>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• <strong>Optimistic Updates:</strong> The list updates instantly before the server responds.</li>
            <li>• <strong>Rollback:</strong> If the server fails, the list reverts to its previous state.</li>
            <li>• <strong>Invalidation:</strong> Queries are refreshed after a successful submission.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
