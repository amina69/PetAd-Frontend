import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { SubmitButton } from "../ui/submitButton";
import { Modal } from "../ui/Modal";
import { rejectRequestSchema } from "../../features/approval/schemas/approvalSchemas";

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

/**
 * Rejection reason dialog. The focus trap, scroll lock, Escape/backdrop
 * handling and focus restoration are provided by the shared `Modal`; this
 * component keeps the form state and validation.
 */
export function RejectionReasonModal({
  isOpen,
  onClose,
  onSubmit,
}: RejectionReasonModalProps) {
  const [reason, setReason] = useState("");
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isValid = rejectRequestSchema.safeParse({ reason: reason.trim() }).success;
  const remainingChars = MIN_REASON_LENGTH - reason.trim().length;

  // Reset state when the dialog closes so reopening starts clean.
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

  const handleReasonChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setReason(event.target.value);
    setError("");
    // Clear selected chip if user modifies the text
    if (selectedChip && event.target.value !== selectedChip) {
      setSelectedChip(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const parsed = rejectRequestSchema.safeParse({ reason: reason.trim() });
    if (!parsed.success) {
      const reasonIssue = parsed.error.issues.find(
        (issue) => issue.path[0] === "reason",
      );
      setError(
        reasonIssue?.message ??
          "Please provide at least 20 characters explaining the rejection",
      );
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

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      role="dialog"
      title="Rejection Reason"
      description="Please provide a reason for rejecting this adoption request"
      closeButtonLabel="Close modal"
      closeButtonDisabled={isSubmitting}
      size="md"
      headerClassName="px-8 pt-10"
      titleClassName="text-[28px] font-bold leading-tight text-[#0D162B]"
      descriptionClassName="text-[15px] leading-relaxed text-gray-500"
      bodyClassName="px-8 pb-8 pt-4"
      data-testid="rejection-reason-modal"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Predefined reason chips */}
        <div className="space-y-3">
          <span className="block text-sm font-medium text-gray-700">
            Quick reasons
          </span>
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
            aria-invalid={error ? true : undefined}
            aria-describedby={
              error ? "rejection-reason-error reason-helper-text" : "reason-helper-text"
            }
          />
          <div className="flex justify-between items-center">
            {error ? (
              <p id="rejection-reason-error" role="alert" className="text-xs text-red-500">
                {error}
              </p>
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
    </Modal>
  );
}
