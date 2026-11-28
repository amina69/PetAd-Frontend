import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import {
  isTopLayer,
  lockBodyScroll,
  registerLayer,
  unregisterLayer,
  unlockBodyScroll,
} from "./layers";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

export type DialogRole = "dialog" | "alertdialog";
export type DialogSize = "sm" | "md" | "lg" | "xl";

export interface DialogBaseProps {
  /** Whether the dialog is mounted. Closed dialogs render nothing. */
  open: boolean;
  /** Called on Escape (unless disabled), backdrop click and the close button. */
  onClose: () => void;
  /** Rendered as the dialog heading and used for `aria-labelledby`. */
  title?: ReactNode;
  /** Optional supporting copy, wired up with `aria-describedby`. */
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** `alertdialog` for confirmations, `dialog` for everything else. */
  role?: DialogRole;
  /** Accessible name for dialogs rendered without a visible `title`. */
  ariaLabel?: string;
  /** Explicit description id when the description is rendered by the caller. */
  ariaDescribedBy?: string;
  /** Element focused when the dialog opens. Defaults to the first focusable element. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Element that receives focus when the dialog closes. Defaults to the previously focused element. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  /** Set to false to render a fully custom header. */
  showCloseButton?: boolean;
  closeButtonLabel?: string;
  closeButtonDisabled?: boolean;
  size?: DialogSize;
  /** `sheet` anchors the panel to a viewport edge; used by `Drawer`. */
  variant?: "center" | "sheet";
  className?: string;
  panelClassName?: string;
  overlayClassName?: string;
  headerClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  "data-testid"?: string;
}

const SIZE_CLASSES: Record<DialogSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

/**
 * Shared dialog surface used by both `Modal` and `Drawer`.
 *
 * It owns the accessibility contract required by the design system: portal
 * rendering, `aria-modal`, a title-derived accessible name, a focus trap,
 * focus restoration to the trigger, Escape/backdrop dismissal and a
 * reference-counted background scroll lock. Nested dialogs are tracked in a
 * stack so only the topmost dialog handles Escape.
 */
export function DialogBase({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  role = "dialog",
  ariaLabel,
  ariaDescribedBy,
  initialFocusRef,
  returnFocusRef,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  closeButtonLabel = "Close dialog",
  closeButtonDisabled = false,
  size = "md",
  variant = "center",
  className,
  panelClassName,
  overlayClassName,
  headerClassName,
  titleClassName,
  descriptionClassName,
  bodyClassName,
  footerClassName,
  "data-testid": dataTestId,
}: DialogBaseProps) {
  const layerId = useId();
  const titleId = `${layerId}-title`;
  const descriptionId = `${layerId}-description`;
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Register the layer and freeze scrolling while the dialog is open, then
  // restore focus to whatever opened it.
  useEffect(() => {
    if (!open) return;

    previouslyFocused.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const explicitReturnFocus = returnFocusRef?.current ?? null;
    registerLayer(layerId);
    lockBodyScroll();

    const panel = panelRef.current;
    const focusTarget =
      initialFocusRef?.current ??
      panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ??
      panel;
    focusTarget?.focus();

    return () => {
      unregisterLayer(layerId);
      unlockBodyScroll();

      const target = explicitReturnFocus ?? previouslyFocused.current;
      previouslyFocused.current = null;
      target?.focus();
    };
  }, [open, layerId, initialFocusRef, returnFocusRef]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isTopLayer(layerId)) return;

      if (event.key === "Escape" && closeOnEscape) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );

      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [open, layerId, closeOnEscape, onClose]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  const overlayClasses = [
    variant === "sheet"
      ? "fixed inset-0 z-[100] bg-slate-900/50"
      : "fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4",
    overlayClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const panelClasses = [
    "relative flex w-full flex-col overflow-y-auto rounded-2xl bg-white shadow-xl",
    variant === "center" ? "max-h-[calc(100vh-2rem)]" : "",
    SIZE_CLASSES[size],
    panelClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return createPortal(
    <div
      className={overlayClasses}
      onClick={handleOverlayClick}
      data-testid={dataTestId ? `${dataTestId}-overlay` : undefined}
    >
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={!title ? ariaLabel : undefined}
        aria-describedby={description ? descriptionId : ariaDescribedBy}
        tabIndex={-1}
        data-testid={dataTestId}
        className={[panelClasses, className].filter(Boolean).join(" ")}
      >
        {showCloseButton ? (
          <button
            type="button"
            onClick={onClose}
            disabled={closeButtonDisabled}
            aria-label={closeButtonLabel}
            className="absolute end-4 top-4 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} aria-hidden="true" />
          </button>
        ) : null}

        {title || description ? (
          <header
            className={[
              "px-6 pb-2 pt-6",
              showCloseButton ? "pe-14" : "",
              headerClassName,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {title ? (
              <h2
                id={titleId}
                className={[
                  "text-lg font-semibold text-slate-900",
                  titleClassName,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {title}
              </h2>
            ) : null}
            {description ? (
              <p
                id={descriptionId}
                className={["mt-2 text-sm text-slate-600", descriptionClassName]
                  .filter(Boolean)
                  .join(" ")}
              >
                {description}
              </p>
            ) : null}
          </header>
        ) : null}

        {children ? (
          <div className={["px-6 py-4", bodyClassName].filter(Boolean).join(" ")}>
            {children}
          </div>
        ) : null}

        {footer ? (
          <footer
            className={["flex justify-end gap-3 px-6 pb-6 pt-2", footerClassName]
              .filter(Boolean)
              .join(" ")}
          >
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export interface ModalProps extends DialogBaseProps {
  size?: DialogSize;
}

/**
 * Centred dialog primitive.
 *
 * @example
 * <Modal open={open} onClose={close} title="Delete listing?">
 *   This cannot be undone.
 * </Modal>
 */
export function Modal(props: ModalProps) {
  return <DialogBase {...props} />;
}
