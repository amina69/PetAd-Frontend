import type { ReactNode } from "react";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmation dialog used by dispute resolution.
 *
 * The dialog is rendered through the shared `Modal`, so it gains a focus trap,
 * focus restoration, background scroll locking and Escape/backdrop dismissal
 * without changing the caller's markup. While `isPending` is true both actions
 * are disabled and the dialog cannot be dismissed.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open
      onClose={onCancel}
      role="alertdialog"
      title={title}
      size="md"
      showCloseButton={false}
      closeOnEscape={!isPending}
      closeOnBackdropClick={!isPending}
      data-testid="confirm-dialog"
      bodyClassName="pt-2"
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? "Saving…" : confirmLabel}
          </button>
        </>
      }
    >
      <div className="text-sm text-gray-600">{description}</div>
    </Modal>
  );
}
