import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
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

const NATIVELY_FOCUSABLE = new Set([
  "button",
  "a",
  "input",
  "select",
  "textarea",
  "summary",
]);

function isNativelyFocusable(element: ReactElement): boolean {
  const props = element.props as Record<string, unknown>;

  return (
    (typeof element.type === "string" && NATIVELY_FOCUSABLE.has(element.type)) ||
    props.tabIndex !== undefined ||
    props.href !== undefined
  );
}

export interface TooltipProps {
  /** Tooltip text. Rendered as plain text so user content cannot inject markup. */
  content: ReactNode;
  /** The trigger. Pass a focusable element so the tooltip is keyboard reachable. */
  children: ReactElement;
  placement?: Placement;
  /** Hover delay in milliseconds. Focus shows the tooltip immediately. */
  delayMs?: number;
  offset?: number;
  disabled?: boolean;
  id?: string;
  className?: string;
}

interface TooltipLayout {
  top: number;
  left: number;
  placement: Placement;
}

/**
 * Tooltip primitive.
 *
 * - Appears on hover and on keyboard focus.
 * - Dismisses on Escape, blur and mouse leave.
 * - Positions itself with flip/shift collision handling and portals into
 *   `document.body` so overflow containers cannot clip it.
 * - Adds `aria-describedby` to the trigger while visible. Non-focusable
 *   children get a focusable wrapper so the description is still reachable.
 */
export function Tooltip({
  content,
  children,
  placement = "top",
  delayMs = 300,
  offset = 8,
  disabled = false,
  id,
  className,
}: TooltipProps) {
  const generatedId = useId();
  const tooltipId = id ?? `${generatedId}-tooltip`;
  const layerId = `${tooltipId}-layer`;
  const [isOpen, setIsOpen] = useState(false);
  const [layout, setLayout] = useState<TooltipLayout | null>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearShowTimer = () => {
    if (showTimer.current !== null) {
      clearTimeout(showTimer.current);
      showTimer.current = null;
    }
  };

  const show = (immediately = false) => {
    if (disabled) return;
    clearShowTimer();

    if (immediately) {
      setIsOpen(true);
      return;
    }

    showTimer.current = setTimeout(() => setIsOpen(true), delayMs);
  };

  const hide = () => {
    clearShowTimer();
    setIsOpen(false);
  };

  useEffect(
    () => () => {
      if (showTimer.current !== null) {
        clearTimeout(showTimer.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!isOpen) return;

    registerLayer(layerId);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isTopLayer(layerId)) {
        event.preventDefault();
        hide();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      unregisterLayer(layerId);
    };
    // hide only calls setState, so the registration effect does not need it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, layerId]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const trigger = wrapperRef.current;
    const panel = panelRef.current;

    if (!trigger || !panel) return;

    const update = () => {
      const panelRect = panel.getBoundingClientRect();

      setLayout(
        computePosition(
          toFloatingRect(trigger),
          { width: panelRect.width, height: panelRect.height },
          placement,
          getViewportSize(),
          { offset },
        ),
      );
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [isOpen, placement, offset]);

  const focusableChild = isValidElement(children) && isNativelyFocusable(children);
  const describedBy = isOpen ? tooltipId : undefined;
  const existingDescribedBy = (children.props as Record<string, unknown>)[
    "aria-describedby"
  ] as string | undefined;
  // Keep any caller-supplied description while adding ours only when open.
  const childDescribedBy =
    [existingDescribedBy, describedBy].filter(Boolean).join(" ") || undefined;

  const trigger =
    isValidElement(children) && focusableChild
      ? cloneElement(children as ReactElement<Record<string, unknown>>, {
          "aria-describedby": childDescribedBy,
        })
      : children;

  return (
    <span
      ref={wrapperRef}
      className="inline-flex"
      onMouseEnter={() => show()}
      onMouseLeave={hide}
      onFocus={() => show(true)}
      onBlur={hide}
      tabIndex={!focusableChild ? 0 : undefined}
      aria-describedby={!focusableChild ? describedBy : undefined}
    >
      {trigger}

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              role="tooltip"
              id={tooltipId}
              data-placement={layout?.placement ?? placement}
              style={{
                position: "fixed",
                top: layout?.top ?? 0,
                left: layout?.left ?? 0,
                visibility: layout ? "visible" : "hidden",
              }}
              className={[
                "pointer-events-none z-[120] max-w-xs rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg",
                className,
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}
