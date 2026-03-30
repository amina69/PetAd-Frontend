interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isLoading = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[400px] rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
      >
        <div className="space-y-6 p-8">
          <div>
            <h2
              id="confirmation-title"
              className="mb-2 text-[24px] font-bold text-[#0D162B]"
            >
              {title}
            </h2>
            <p className="text-[14px] leading-relaxed text-gray-500">
              {message}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-xl border-2 border-gray-800 py-3 text-[14px] font-semibold text-gray-800 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 rounded-xl py-3 text-[14px] font-semibold text-white transition-colors ${
                isLoading
                  ? "cursor-not-allowed bg-gray-400"
                  : "bg-[#E84D2A] hover:bg-[#d4431f]"
              }`}
              type="button"
            >
              {isLoading ? "Loading..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}