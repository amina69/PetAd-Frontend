import { useState } from "react";
import { RaiseDisputeModal } from "../modals/RaiseDisputeModal";

interface Props {
  adoptionId: string;
  adoptionStatus: string;
  raisedBy: string;
  isAdopter: boolean;
  isShelter: boolean;
}

export function RaiseDisputeTrigger({
  adoptionId,
  adoptionStatus,
  raisedBy,
  isAdopter,
  isShelter,
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canRaiseDispute =
    adoptionStatus === "CUSTODY_ACTIVE" && (isAdopter || isShelter);

  if (!canRaiseDispute) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 rounded-md border border-red-300 text-red-600 text-sm hover:bg-red-50 transition-colors"
      >
        Raise a dispute
      </button>

      <RaiseDisputeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        adoptionId={adoptionId}
        raisedBy={raisedBy}
      />
    </>
  );
}