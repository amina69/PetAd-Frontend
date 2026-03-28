import { useState } from "react";
import { RaiseDisputeModal } from "./RaiseDisputeModal";

interface RaiseDisputeButtonProps {
  status: string;
  isAdopter: boolean;
  isShelter: boolean;
  targetId: string;
}

export function RaiseDisputeButton({
  status,
  isAdopter,
  isShelter,
  targetId,
}: RaiseDisputeButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Visible when status=CUSTODY_ACTIVE and (isAdopter or isShelter)
  const isVisible = status === "CUSTODY_ACTIVE" && (isAdopter || isShelter);

  if (!isVisible) return null;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors border border-red-200"
      >
        Raise a dispute
      </button>
      
      <RaiseDisputeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetId={targetId}
      />
    </>
  );
}