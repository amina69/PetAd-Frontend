import { useEffect, useRef, useState, useCallback } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  adoptionId: string;
  currentStatus: string;
  onSubmit: (data: { adoptionId: string; targetStatus: string; reason: string }) => void;
}

const VALID_TARGET_STATUSES = ["APPROVED", "REJECTED", "COMPLETED"];
const BLOCKCHAIN_STATUSES = ["COMPLETED"];

export function AdminStatusOverrideModal({
  isOpen,
  onClose,
  adoptionId,
  currentStatus,
  onSubmit,
}: Props) {
  const [targetStatus, setTargetStatus] = useState("");
  const [reason, setReason] = useState("");
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const handleClose = useCallback(() => {
    setTargetStatus("");
    setReason("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }

      if (event.key === "Tab") {
        const modal = document.querySelector('[role="dialog"]');
        if (!modal) return;

        const focusableElements = modal.querySelectorAll<HTMLElement>(
          'button, select, textarea, input, [href], [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const trimmedReason = reason.trim();
  const isReasonValid = trimmedReason.length >= 10;
  const isSubmitDisabled = !targetStatus || !isReasonValid;
  const showBlockchainWarning = BLOCKCHAIN_STATUSES.includes(targetStatus);

  const handleSubmit = () => {
    if (isSubmitDisabled) return;

    onSubmit({
      adoptionId,
      targetStatus,
      reason: trimmedReason,
    });

    handleClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-[420px] rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-status-override-title"
      >
        <button
          ref={closeButtonRef}
          onClick={handleClose}
          className="absolute right-5 top-5 rounded-lg p-1 transition-colors hover:bg-gray-100"
          aria-label="Close modal"
          type="button"
        >
          <svg
            className="h-5 w-5 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="space-y-6 p-8">
          <div>
            <h2
              id="admin-status-override-title"
              className="mb-2 text-[24px] font-bold text-[#0D162B]"
            >
              Override Adoption Status
            </h2>
            <p className="text-[14px] leading-relaxed text-gray-500">
              Adoption ID: {adoptionId}
            </p>
            <p className="text-[14px] leading-relaxed text-gray-500">
              Current status: <strong>{currentStatus}</strong>
            </p>
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-medium text-gray-700">
              Select New Status
            </label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[14px] text-gray-700 outline-none transition focus:ring-2 focus:ring-[#E84D2A]/30"
            >
              <option value="">Select status</option>
              {VALID_TARGET_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-medium text-gray-700">
              Reason
            </label>
            <textarea
              placeholder="Enter reason for overriding the status"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-[14px] text-gray-700 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-[#E84D2A]/30"
            />
            <p className="mt-1 text-[12px] text-gray-500">
              {reason.length} characters (min 10)
            </p>
          </div>

          {showBlockchainWarning && (
            <p className="text-[13px] text-yellow-600">
              Requires on-chain confirmation
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleClose}
              className="flex-1 rounded-xl border-2 border-gray-800 py-3 text-[14px] font-semibold text-gray-800 transition-colors hover:bg-gray-50"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className={`flex-1 rounded-xl py-3 text-[14px] font-semibold text-white transition-colors ${
                isSubmitDisabled
                  ? "cursor-not-allowed bg-gray-400"
                  : "bg-[#E84D2A] hover:bg-[#d4431f]"
              }`}
              type="button"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}