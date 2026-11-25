import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  computePosition,
  getViewportSize,
  toFloatingRect,
  type Placement,
} from "./floating";
import { isTopLayer, registerLayer, unregisterLayer } from "./layers";

export interface PopoverProps {
  /** Trigger element. Receives `aria-expanded`, `aria-controls` and the toggle handler. */
  trigger: ReactElement;
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: Placement;
  offset?: number;
  /** Role of the panel. Defaults to `dialog`. */
  role?: string;
  /** Accessible name for the panel. */
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaModal?: boolean;
  /** `aria-haspopup` value exposed on the trigger. */
  hasPopup?: "dialog" | "menu" | "listbox" | true;
  /** Stretch the panel to the trigger width. */
  matchTriggerWidth?: boolean;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  /** Extra classes for the panel. */
  className?: string;
  /** Extra classes for the positioning wrapper around the trigger. */
  containerClassName?: string;
  id?: string;
  "data-testid"?: string;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

interface PopoverLayout {
  top: number;
  left: number;
  placement: Placement;
  triggerWidth: number;
}

/**
 * Anchored popover with portal rendering, outside-click dismissal, Escape
 * dismissal and flip/shift collision handling.
 *
 * The trigger keeps its own click handler; the popover toggles after it runs.
 * Escape returns focus to the trigger, and only the topmost layer reacts so a
 * popover nested inside a modal closes before the modal.
 */
export function Popover({
  trigger,
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  placement = "bottom-end",
  offset = 8,
  role = "dialog",
  ariaLabel,
  ariaLabelledBy,
  ariaModal = false,
  hasPopup = "dialog",
  matchTriggerWidth = false,
  closeOnOutsideClick = true,
  closeOnEscape = true,
  className,
  containerClassName,
  id,
  "data-testid": dataTestId,
}: PopoverProps) {
  const generatedId = useId();
  const panelId = id ?? `${generatedId}-popover`;
  const layerId = `${panelId}-layer`;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = open ?? uncontrolledOpen;
  const [layout, setLayout] = useState<PopoverLayout | null>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  const setOpen = (nextOpen: boolean) => {
    if (open === undefined) {
      setUncontrolledOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  };

  const focusTrigger = () => {
    const target =
      triggerElementRef.current ??
      wrapperRef.current?.querySelector<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]",
      );

    target?.focus();
  };

  useEffect(() => {
    if (!isOpen) return;

    registerLayer(layerId);

    return () => unregisterLayer(layerId);
  }, [isOpen, layerId]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;

      if (
        target &&
        (panelRef.current?.contains(target) || wrapperRef.current?.contains(target))
      ) {
        return;
      }

      if (closeOnOutsideClick) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isTopLayer(layerId)) return;

      if (event.key === "Escape" && closeOnEscape) {
        event.preventDefault();
        setOpen(false);
        focusTrigger();
        return;
      }

      // Modal popovers trap Tab the same way a modal dialog does.
      if (event.key !== "Tab" || !ariaModal) return;

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

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
    // setOpen/focusTrigger are recreated each render by design; the listeners
    // only need the current open state and the refs they read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, layerId, closeOnOutsideClick, closeOnEscape, ariaModal]);

  useEffect(() => {
    if (!isOpen || !ariaModal) return;

    const panel = panelRef.current;
    const target =
      panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? panel;

    target?.focus();
  }, [isOpen, ariaModal]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const wrapper = wrapperRef.current;
    const panel = panelRef.current;

    if (!wrapper || !panel) return;

    const update = () => {
      const triggerRect = toFloatingRect(wrapper);
      const panelRect = panel.getBoundingClientRect();

      setLayout({
        ...computePosition(
          triggerRect,
          { width: panelRect.width, height: panelRect.height },
          placement,
          getViewportSize(),
          { offset },
        ),
        triggerWidth: triggerRect.width,
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [isOpen, placement, offset]);

  const triggerProps = isValidElement(trigger)
    ? (trigger.props as Record<string, unknown>)
    : {};
  const childOnClick = triggerProps.onClick as
    | ((event: ReactMouseEvent<HTMLElement>) => void)
    | undefined;

  const clonedTrigger = isValidElement(trigger)
    ? cloneElement(trigger as ReactElement<Record<string, unknown>>, {
        "aria-expanded": isOpen,
        "aria-controls": isOpen ? panelId : undefined,
        "aria-haspopup": hasPopup === true ? "true" : hasPopup,
        onClick: (event: ReactMouseEvent<HTMLElement>) => {
          triggerElementRef.current = event.currentTarget;
          childOnClick?.(event);

          if (!event.defaultPrevented) {
            setOpen(!isOpen);
          }
        },
      })
    : trigger;

  return (
    <span
      ref={wrapperRef}
      className={["relative inline-flex", containerClassName]
        .filter(Boolean)
        .join(" ")}
    >
      {clonedTrigger}

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              id={panelId}
              role={role}
              aria-label={ariaLabel}
              aria-labelledby={ariaLabelledBy}
              aria-modal={ariaModal || undefined}
              tabIndex={-1}
              data-testid={dataTestId}
              data-placement={layout?.placement ?? placement}
              style={{
                position: "fixed",
                top: layout?.top ?? 0,
                left: layout?.left ?? 0,
                width:
                  matchTriggerWidth && layout ? layout.triggerWidth : undefined,
                visibility: layout ? "visible" : "hidden",
              }}
              className={[
                "z-[110] rounded-xl border border-gray-200 bg-white shadow-xl",
                className,
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}
