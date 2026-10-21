import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";

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
  const titleId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const trigger = triggerRef?.current ?? null;
    cancelButtonRef.current?.focus();
    return () => {
      const target = trigger ?? previouslyFocused.current;
      target?.focus();
    };
  }, [open, triggerRef]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
      >
        <h2 id={titleId} className="text-lg font-semibold text-slate-900">
          {title}
        </h2>
        {description ? <div className="mt-2 text-sm text-slate-600">{description}</div> : null}
        <div className="mt-6 flex justify-end gap-2">
          <button ref={cancelButtonRef} type="button" className="rounded-lg px-3 py-2 text-sm" onClick={onCancel}>
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
        </div>
      </div>
    </div>
  );
}
