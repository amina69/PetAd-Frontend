import { useState, useEffect, useRef, useCallback } from "react";
import { SubmitButton } from "../ui/submitButton";

interface RejectionReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

const PREDEFINED_REASONS = [
  "Incomplete documents",
  "Pet not suitable",
  "Adopter profile concern",
  "Other",
];

const MIN_REASON_LENGTH = 20;

export function RejectionReasonModal({
  isOpen,
  onClose,
  onSubmit,
}: RejectionReasonModalProps) {
  const [reason, setReason] = useState("");
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const isValid = reason.trim().length >= MIN_REASON_LENGTH;
  const remainingChars = MIN_REASON_LENGTH - reason.trim().length;

  // Focus trap implementation
  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (!modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement?.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement?.focus();
    }
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
      if (e.key === "Tab" && isOpen) {
        trapFocus(e);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Focus the close button when modal opens
      closeButtonRef.current?.focus();
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose, trapFocus]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setReason("");
      setSelectedChip(null);
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleChipClick = (chip: string) => {
    setSelectedChip(chip);
    setReason(chip);
    setError("");
  };

  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReason(e.target.value);
    setError("");
    // Clear selected chip if user modifies the text
    if (selectedChip && e.target.value !== selectedChip) {
      setSelectedChip(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      setError(`Please provide at least ${MIN_REASON_LENGTH} characters`);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onSubmit(reason.trim());
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit rejection reason. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300 relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rejection-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          ref={closeButtonRef}
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Close modal"
        >
          <svg
            className="w-5 h-5 text-gray-500"
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

        <div className="p-8 pt-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header */}
            <div className="text-start">
              <h3
                id="rejection-modal-title"
                className="text-[28px] font-bold text-[#0D162B] mb-2"
              >
                Rejection Reason
              </h3>
              <p className="text-gray-500 text-[15px] leading-relaxed">
                Please provide a reason for rejecting this adoption request
              </p>
            </div>

            {/* Predefined reason chips */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 block">
                Quick reasons
              </label>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_REASONS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleChipClick(chip)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                      ${
                        selectedChip === chip
                          ? "bg-[#E84D2A] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason textarea */}
            <div className="space-y-2">
              <label
                htmlFor="rejection-reason"
                className="text-sm font-medium text-gray-700 block"
              >
                Detailed reason
              </label>
              <textarea
                ref={textareaRef}
                id="rejection-reason"
                value={reason}
                onChange={handleReasonChange}
                placeholder="Please explain why you are rejecting this adoption request..."
                minLength={MIN_REASON_LENGTH}
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all resize-none
                  focus:border-[#E84D2A] focus:ring-2 focus:ring-[#E84D2A]/20
                  min-h-[120px]
                  ${
                    error
                      ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                      : "border-gray-200"
                  }`}
                rows={4}
                aria-describedby="reason-helper-text"
              />
              <div className="flex justify-between items-center">
                {error ? (
                  <p className="text-xs text-red-500">{error}</p>
                ) : (
                  <span />
                )}
                <span
                  id="reason-helper-text"
                  className={`text-xs ${
                    remainingChars > 0 ? "text-gray-400" : "text-green-600"
                  }`}
                >
                  {remainingChars > 0
                    ? `${remainingChars} characters remaining`
                    : "Minimum length met"}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <SubmitButton
              label="Submit Rejection"
              isLoading={isSubmitting}
              loadingLabel="Submitting..."
              disabled={!isValid}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
