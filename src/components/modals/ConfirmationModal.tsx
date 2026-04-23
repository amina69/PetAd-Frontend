import { useEffect, useRef, useCallback, useId } from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

export function ConfirmationModal({
  isOpen,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isDangerous = false,
}: ConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();


  useEffect(() => {
    if (isOpen) {
      confirmButtonRef.current?.focus();
    }
  }, [isOpen]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onCancel();
      }
      if (e.key === "Tab" && isOpen) {
        trapFocus(e);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onCancel, trapFocus]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-[400px] rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="space-y-6 p-8">
          <div>
            <h2
              id={titleId}
              className="mb-2 text-[24px] font-bold text-[#0D162B]"
            >
              {title}
            </h2>
            <p className="text-[14px] leading-relaxed text-gray-500">{body}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl border-2 border-gray-800 py-3 text-[14px] font-semibold text-gray-800 transition-colors hover:bg-gray-50"
              type="button"
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmButtonRef}
              onClick={onConfirm}
              className={`flex-1 rounded-xl py-3 text-[14px] font-semibold text-white transition-colors ${
                isDangerous
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-[#E84D2A] hover:bg-[#d4431f]"
              }`}
              type="button"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}