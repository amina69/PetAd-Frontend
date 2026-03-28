import { useState } from "react";
import { FileUpload } from "../components/ui/fileUpload";
import { SubmitButton } from "../components/ui/submitButton";
import { useMutateRaiseDispute } from "../hooks/useMutateRaiseDispute";

interface RaiseDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
}

export function RaiseDisputeModal({
  isOpen,
  onClose,
  targetId,
}: RaiseDisputeModalProps) {
  const [reason, setReason] = useState("");
  const [files, setFiles] = useState<(File | null)[]>([null, null, null]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { mutateAsync, progress, resetProgress } = useMutateRaiseDispute();
  const minReasonLength = 30;

  const handleFileChange = (index: number, file: File | null) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      newFiles[index] = file;
      return newFiles;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (reason.length < minReasonLength) {
      setError(`Reason must be at least ${minReasonLength} characters long.`);
      return;
    }

    setIsSubmitting(true);
    setError("");
    resetProgress();

    const validFiles = files.filter((f): f is File => f !== null);

    try {
      await mutateAsync({ targetId, reason, files: validFiles });

      setToast({ message: "Dispute raised. Escrow paused.", type: "success" });
      setTimeout(() => {
        setToast(null);
        handleClose();
      }, 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      setError(message);
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setReason("");
    setFiles([null, null, null]);
    setError("");
    resetProgress();
    onClose();
  };

  if (!isOpen && !toast) return null;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-[500px] bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300 relative max-h-[90vh] flex flex-col"
            role="dialog"
            aria-modal="true"
          >
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

            <div className="p-6 lg:p-8 flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="text-start">
                  <h3 className="text-xl lg:text-2xl font-bold text-[#0D162B] mb-2">
                    Raise a Dispute
                  </h3>
                  <p className="text-gray-500 text-[14px] leading-relaxed">
                    Please provide a detailed reason and upload any supporting
                    evidence.
                  </p>
                </div>

                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label
                    htmlFor="reason"
                    className="text-sm font-medium text-gray-700 block"
                  >
                    Reason for Dispute <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe the issue in detail..."
                    className={`w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all resize-none
                      focus:border-[#E84D2A] focus:ring-2 focus:ring-[#E84D2A]/20
                      min-h-[120px] ${
                        reason.length > 0 && reason.length < minReasonLength
                          ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                          : ""
                      }`}
                    rows={4}
                  />
                  <div className="flex justify-between text-xs">
                    <span
                      className={
                        reason.length > 0 && reason.length < minReasonLength
                          ? "text-red-500"
                          : "text-gray-500"
                      }
                    >
                      {reason.length > 0 && reason.length < minReasonLength
                        ? `Minimum ${minReasonLength} characters required`
                        : "Minimum length met"}
                    </span>
                    <span className="text-gray-500">{reason.length} chars</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-medium text-gray-700 block">
                    Supporting Evidence (Optional)
                  </label>
                  <FileUpload
                    id="evidence-1"
                    label="Evidence 1"
                    selectedFile={files[0]}
                    onChange={(f) => handleFileChange(0, f)}
                  />
                  <FileUpload
                    id="evidence-2"
                    label="Evidence 2"
                    selectedFile={files[1]}
                    onChange={(f) => handleFileChange(1, f)}
                  />
                  <FileUpload
                    id="evidence-3"
                    label="Evidence 3"
                    selectedFile={files[2]}
                    onChange={(f) => handleFileChange(2, f)}
                  />
                </div>

                {isSubmitting && progress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Uploading evidence...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#E84D2A] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <SubmitButton
                  label="Submit Dispute"
                  isLoading={isSubmitting}
                />
              </form>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="alert"
          aria-live="assertive"
          data-testid={`toast-${toast.type}`}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3
            px-5 py-3.5 rounded-xl shadow-xl text-white text-[14px] font-medium
            ${toast.type === "success" ? "bg-[#22863a]" : "bg-[#E84D2A]"}`}
        >
          {toast.type === "success" ? (
            <svg
              className="w-5 h-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
          {toast.message}
        </div>
      )}
    </>
  );
}