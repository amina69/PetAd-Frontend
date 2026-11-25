import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
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

export interface MenuItem {
  id?: string;
  label: ReactNode;
  /** Plain text used by typeahead when `label` is not a string. */
  textValue?: string;
  onSelect?: () => void;
  href?: string;
  disabled?: boolean;
  destructive?: boolean;
  icon?: ReactNode;
}

export interface MenuProps {
  /** Trigger button. Receives `aria-haspopup="menu"` and `aria-expanded`. */
  trigger: ReactElement;
  items: readonly MenuItem[];
  /** Accessible name for the menu, e.g. "Listing actions". */
  ariaLabel: string;
  placement?: Placement;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  itemClassName?: string;
  /** Time window for multi-character typeahead. Defaults to 500ms. */
  typeaheadTimeoutMs?: number;
}

interface MenuLayout {
  top: number;
  left: number;
  placement: Placement;
}

/**
 * Menu button implementing the WAI-ARIA menu pattern.
 *
 * - ArrowDown/ArrowUp/Home/End move focus, wrapping at the ends and skipping
 *   disabled items.
 * - Printable characters run prefix typeahead across item labels.
 * - Escape closes the menu and returns focus to the trigger.
 * - Outside clicks and Tab close the menu.
 */
export function Menu({
  trigger,
  items,
  ariaLabel,
  placement = "bottom-start",
  open,
  defaultOpen = false,
  onOpenChange,
  className,
  itemClassName,
  typeaheadTimeoutMs = 500,
}: MenuProps) {
  const generatedId = useId();
  const menuId = `${generatedId}-menu`;
  const layerId = `${generatedId}-menu-layer`;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = open ?? uncontrolledOpen;
  const [layout, setLayout] = useState<MenuLayout | null>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const searchBuffer = useRef("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setOpen = (nextOpen: boolean) => {
    if (open === undefined) {
      setUncontrolledOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  };

  const focusTrigger = () => {
    const target =
      triggerRef.current ??
      wrapperRef.current?.querySelector<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]",
      );

    target?.focus();
  };

  const enabledIndexes = items
    .map((item, index) => (item.disabled ? -1 : index))
    .filter((index) => index !== -1);

  const focusItem = (index: number) => {
    itemRefs.current[index]?.focus();
  };

  useEffect(() => {
    if (!isOpen) return;

    registerLayer(layerId);

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;

      if (
        target &&
        (panelRef.current?.contains(target) || wrapperRef.current?.contains(target))
      ) {
        return;
      }

      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isTopLayer(layerId)) {
        event.preventDefault();
        setOpen(false);
        focusTrigger();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      unregisterLayer(layerId);
    };
    // setOpen/focusTrigger intentionally excluded: listeners read stable refs
    // and the current open state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, layerId]);

  useEffect(() => {
    return () => {
      if (searchTimer.current !== null) {
        clearTimeout(searchTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    focusItem(enabledIndexes[0] ?? -1);
    // Only refocus when the menu opens, not whenever `items` is re-created.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const wrapper = wrapperRef.current;
    const panel = panelRef.current;

    if (!wrapper || !panel) return;

    const update = () => {
      const panelRect = panel.getBoundingClientRect();

      setLayout(
        computePosition(
          toFloatingRect(wrapper),
          { width: panelRect.width, height: panelRect.height },
          placement,
          getViewportSize(),
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
  }, [isOpen, placement]);

  const getItemText = (item: MenuItem): string =>
    item.textValue ?? (typeof item.label === "string" ? item.label : "");

  const handleTypeahead = (key: string) => {
    if (searchTimer.current !== null) {
      clearTimeout(searchTimer.current);
    }

    searchBuffer.current = `${searchBuffer.current}${key.toLowerCase()}`;
    searchTimer.current = setTimeout(() => {
      searchBuffer.current = "";
    }, typeaheadTimeoutMs);

    const matchIndex = items.findIndex(
      (item) =>
        !item.disabled &&
        getItemText(item).toLowerCase().startsWith(searchBuffer.current),
    );

    if (matchIndex !== -1) {
      focusItem(matchIndex);
    }
  };

  const handlePanelKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!enabledIndexes.length) return;

    const currentIndex = itemRefs.current.findIndex(
      (element) => element === document.activeElement,
    );
    const currentPosition = enabledIndexes.indexOf(currentIndex);

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        const nextPosition =
          currentPosition === -1
            ? 0
            : (currentPosition + 1) % enabledIndexes.length;
        focusItem(enabledIndexes[nextPosition]);
        return;
      }
      case "ArrowUp": {
        event.preventDefault();
        const nextPosition =
          currentPosition === -1
            ? enabledIndexes.length - 1
            : (currentPosition - 1 + enabledIndexes.length) % enabledIndexes.length;
        focusItem(enabledIndexes[nextPosition]);
        return;
      }
      case "Home": {
        event.preventDefault();
        focusItem(enabledIndexes[0]);
        return;
      }
      case "End": {
        event.preventDefault();
        focusItem(enabledIndexes[enabledIndexes.length - 1]);
        return;
      }
      case "Tab": {
        setOpen(false);
        return;
      }
      default: {
        if (
          event.key.length === 1 &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey
        ) {
          handleTypeahead(event.key);
        }
      }
    }
  };

  const handleSelect = (item: MenuItem) => {
    if (item.disabled) return;

    item.onSelect?.();
    setOpen(false);
    focusTrigger();
  };

  const triggerProps = isValidElement(trigger)
    ? (trigger.props as Record<string, unknown>)
    : {};
  const childOnClick = triggerProps.onClick as
    | ((event: ReactMouseEvent<HTMLElement>) => void)
    | undefined;
  const childOnKeyDown = triggerProps.onKeyDown as
    | ((event: ReactKeyboardEvent<HTMLElement>) => void)
    | undefined;

  const clonedTrigger = isValidElement(trigger)
    ? cloneElement(trigger as ReactElement<Record<string, unknown>>, {
        "aria-haspopup": "menu",
        "aria-expanded": isOpen,
        "aria-controls": isOpen ? menuId : undefined,
        onClick: (event: ReactMouseEvent<HTMLElement>) => {
          triggerRef.current = event.currentTarget;
          childOnClick?.(event);

          if (!event.defaultPrevented) {
            setOpen(!isOpen);
          }
        },
        onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => {
          childOnKeyDown?.(event);

          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
        },
      })
    : trigger;

  return (
    <span ref={wrapperRef} className="relative inline-flex">
      {clonedTrigger}

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              id={menuId}
              role="menu"
              aria-label={ariaLabel}
              data-placement={layout?.placement ?? placement}
              style={{
                position: "fixed",
                top: layout?.top ?? 0,
                left: layout?.left ?? 0,
                visibility: layout ? "visible" : "hidden",
              }}
              onKeyDown={handlePanelKeyDown}
              className={[
                "z-[110] min-w-48 rounded-xl border border-gray-200 bg-white p-1 shadow-xl",
                className,
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {items.map((item, index) => {
                const itemClasses = [
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-inset",
                  item.disabled
                    ? "cursor-not-allowed text-gray-400"
                    : item.destructive
                      ? "text-red-600 hover:bg-red-50 focus:bg-red-50"
                      : "text-gray-700 hover:bg-gray-50 focus:bg-gray-50",
                  itemClassName,
                ]
                  .filter(Boolean)
                  .join(" ");

                const content = (
                  <>
                    {item.icon ? (
                      <span aria-hidden="true" className="shrink-0">
                        {item.icon}
                      </span>
                    ) : null}
                    <span className="flex-1">{item.label}</span>
                  </>
                );

                if (item.href) {
                  return (
                    <a
                      key={item.id ?? index}
                      ref={(node) => {
                        itemRefs.current[index] = node;
                      }}
                      role="menuitem"
                      href={item.href}
                      tabIndex={-1}
                      aria-disabled={item.disabled || undefined}
                      onClick={() => handleSelect(item)}
                      className={itemClasses}
                    >
                      {content}
                    </a>
                  );
                }

                return (
                  <button
                    key={item.id ?? index}
                    ref={(node) => {
                      itemRefs.current[index] = node;
                    }}
                    type="button"
                    role="menuitem"
                    tabIndex={-1}
                    disabled={item.disabled}
                    onClick={() => handleSelect(item)}
                    className={itemClasses}
                  >
                    {content}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}
