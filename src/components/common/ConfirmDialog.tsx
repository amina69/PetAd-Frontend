import { useRef, type ReactNode, type RefObject } from "react";
import { Modal } from "../ui/Modal";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  triggerRef?: RefObject<HTMLElement | null>;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmation dialog. The destructive variant uses the danger token.
 * Closing the dialog returns focus to `triggerRef` when one is provided,
 * otherwise to the element that was focused when it opened.
 *
 * Rendering, focus trapping/restoration, scroll locking and Escape handling
 * come from the shared `Modal` primitive.
 *
 * @example
 * <ConfirmDialog
 *   open={open}
 *   title="Remove listing?"
 *   destructive
 *   triggerRef={buttonRef}
 *   onConfirm={remove}
 *   onCancel={() => setOpen(false)}
 * />
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  triggerRef,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      role="dialog"
      size="md"
      showCloseButton={false}
      initialFocusRef={cancelButtonRef}
      returnFocusRef={triggerRef}
      data-testid="confirm-dialog"
      footer={
        <>
          <button
            ref={cancelButtonRef}
            type="button"
            className="rounded-lg px-3 py-2 text-sm"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={
              destructive
                ? "rounded-lg bg-red-600 px-3 py-2 text-sm text-white"
                : "rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
            }
            data-variant={destructive ? "destructive" : "default"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </>
      }
    />
  );
}
