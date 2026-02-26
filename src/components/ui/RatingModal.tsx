import { useState } from "react";
import { StarRating } from "./StarRating";
import { SubmitButton } from "./submitButton";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, feedback: string) => Promise<void>;
  petName?: string;
}

type ModalState = "form" | "success";

export function RatingModal({
  isOpen,
  onClose,
  onSubmit,
  petName,
}: RatingModalProps) {
  const [modalState, setModalState] = useState<ModalState>("form");
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const maxFeedbackLength = 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onSubmit(rating, feedback);
      setModalState("success");
    } catch (err) {
      setError(
        err
          ? "Failed to submit rating. Please try again."
          : "Failed to submit rating. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setModalState("form");
      setRating(0);
      setFeedback("");
      setError("");
      onClose();
    }
  };

  const handleSuccessClose = () => {
    setModalState("form");
    setRating(0);
    setFeedback("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-[400px] bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300 relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Close button */}
        <button
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
          {modalState === "form" ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Header */}
              <div className="text-start">
                <h3 className="text-[28px] font-bold text-[#0D162B] mb-2">
                  Rate Adoption
                </h3>
                <p className="text-gray-500 text-[15px] leading-relaxed">
                  Rate & share your experience
                  {petName && ` with ${petName}`}
                </p>
              </div>

              {/* Star Rating */}
              <div className="space-y-2">
                <div className="flex justify-center">
                  <StarRating
                    rating={rating}
                    onRatingChange={setRating}
                    size="lg"
                  />
                </div>
                {rating === 0 && error && (
                  <p className="text-xs text-red-500 text-center">{error}</p>
                )}
              </div>

              {/* Feedback Textarea */}
              <div className="space-y-2">
                <label
                  htmlFor="feedback"
                  className="text-sm font-medium text-gray-700 block"
                >
                  Feedback
                </label>
                <textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="describe your experience"
                  maxLength={maxFeedbackLength}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all resize-none
                    focus:border-[#E84D2A] focus:ring-2 focus:ring-[#E84D2A]/20
                    min-h-[100px]"
                  rows={4}
                />
                <div className="text-xs text-gray-500 text-right">
                  {feedback.length}/{maxFeedbackLength}
                </div>
              </div>

              {/* Submit Button */}
              <SubmitButton
                label="Submit"
                isLoading={isSubmitting}
                loadingLabel="Submitting..."
              />
            </form>
          ) : (
            /* Success State */
            <div className="text-center space-y-6">
              <div>
                <h3 className="text-[28px] font-bold text-[#0D162B] mb-4">
                  Feedback Received!
                </h3>
                <p className="text-gray-500 text-[15px] leading-relaxed">
                  You have successfully submitted your rating & feedback on your
                  experience.
                </p>
              </div>

              <button
                onClick={handleSuccessClose}
                className="w-full bg-[#E84D2A] text-white font-medium text-[15px] py-4 rounded-xl hover:bg-[#d4431f] transition-colors focus:ring-4 focus:ring-[#E84D2A]/20 active:scale-[0.98]"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
