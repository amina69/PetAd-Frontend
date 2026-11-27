import { useRef } from "react";
import { Modal } from "../ui/Modal";

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

/**
 * Destructive confirmation dialog. Behaviour (focus trap, Escape, backdrop
 * dismissal, focus restoration and scroll lock) comes from the shared `Modal`
 * primitive; this component only supplies the copy and the confirm/cancel
 * actions.
 */
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
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <Modal
      open={isOpen}
      onClose={onCancel}
      title={title}
      role="alertdialog"
      size="md"
      initialFocusRef={confirmButtonRef}
      showCloseButton={false}
      data-testid="confirmation-modal"
      overlayClassName="bg-black/60 backdrop-blur-sm"
      bodyClassName="pt-2"
      footer={
        <>
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            className={
              isDangerous
                ? "rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                : "rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            }
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{body}</p>
    </Modal>
  );
}
