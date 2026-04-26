import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRoleGuard } from '../../../hooks/useRoleGuard';
import { useAdoptionApprovals } from '../../../hooks/useAdoptionApprovals';
import { RejectionReasonModal } from '../../modals/RejectionReasonModal';

export interface ApproveRejectButtonsProps {
  adoptionId: string;
}

export function ApproveRejectButtons({ adoptionId }: ApproveRejectButtonsProps) {
  const { hasAccess } = useRoleGuard();
  const { hasDecided, requiredRoles, mutateApprovalDecision, isPending } = useAdoptionApprovals();

  // Temporary fix to avoid unused variable while it's only a prop needed for the tests
  console.log("Rendering ApproveRejectButtons for adoption ID:", adoptionId);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Render the component ONLY IF:
  // hasAccess(requiredRoles) is true AND hasDecided === false
  if (!hasAccess(requiredRoles) || hasDecided) {
    return null;
  }

  const handleApprove = async () => {
    try {
      await mutateApprovalDecision();
      toast.success("Your approval has been recorded");
    } catch {
      toast.error("Failed to record approval");
    }
  };

  const handleReject = async () => {
    try {
      await mutateApprovalDecision();
      toast.success("Your approval has been recorded");
    } catch (error) {
      toast.error("Failed to record rejection");
      throw error; // Re-throw so modal can handle it
    }
  };

  return (
    <div className="flex flex-row items-center gap-4">
      <button
        onClick={handleApprove}
        disabled={isPending}
        aria-label="Approve adoption"
        className="relative flex items-center justify-center px-4 py-2 font-medium text-green-600 border-2 border-green-600 rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[100px]"
      >
        {isPending ? (
          <span className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" aria-label="Loading spinner"></span>
        ) : (
          "Approve"
        )}
      </button>

      <button
        onClick={() => setIsModalOpen(true)}
        disabled={isPending}
        aria-label="Reject adoption"
        className="relative flex items-center justify-center px-4 py-2 font-medium text-red-600 border-2 border-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[100px]"
      >
        {isPending ? (
          <span className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" aria-label="Loading spinner"></span>
        ) : (
          "Reject"
        )}
      </button>

      <RejectionReasonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleReject}
      />
    </div>
  );
}
