import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export interface TabItem {
  /** Unique value used for selection and DOM ids. */
  value: string;
  label: ReactNode;
  content?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: readonly TabItem[];
  /** Controlled selected tab value. */
  value?: string;
  /** Uncontrolled initial selected tab value. Defaults to the first tab. */
  defaultValue?: string;
  /** Called with the newly selected tab value. */
  onValueChange?: (value: string) => void;
  /** Accessible name for the tab list, e.g. "Approval status". */
  ariaLabel: string;
  /** Prefix for generated tab/panel ids. */
  id?: string;
  className?: string;
  listClassName?: string;
  tabClassName?: string;
  panelClassName?: string;
}

const TAB_BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40";

/**
 * WAI-ARIA tabs with automatic activation and roving tabindex.
 *
 * Only the selected tab is in the Tab order; Arrow keys move (and activate)
 * between tabs, Home/End jump to the first/last enabled tab. Arrow direction
 * follows the closest `dir` attribute so RTL layouts behave as expected.
 *
 * Selection is controlled or uncontrolled; pass `value` + `onValueChange` to
 * sync the active tab with the URL in the calling route.
 */
export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  ariaLabel,
  id,
  className,
  listClassName,
  tabClassName,
  panelClassName,
}: TabsProps) {
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const [uncontrolledValue, setUncontrolledValue] = useState(
    () => defaultValue ?? items[0]?.value ?? "",
  );
  const selectedValue = value ?? uncontrolledValue;
  const selectedItem =
    items.find((item) => item.value === selectedValue) ?? items[0];
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());

  const selectTab = (nextValue: string) => {
    if (nextValue === selectedValue) return;

    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }

    onValueChange?.(nextValue);
  };

  const focusTab = (nextValue: string) => {
    tabRefs.current.get(nextValue)?.focus();
  };

  const enabledTabs = items.filter((item) => !item.disabled);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!enabledTabs.length) return;

    const currentIndex = enabledTabs.findIndex(
      (item) => item.value === selectedItem?.value,
    );
    const isRtl =
      (event.currentTarget.closest("[dir]") as HTMLElement | null)?.getAttribute(
        "dir",
      ) === "rtl";

    const step = (delta: number) => {
      if (currentIndex === -1) {
        return delta > 0 ? 0 : enabledTabs.length - 1;
      }

      return (currentIndex + delta + enabledTabs.length) % enabledTabs.length;
    };

    let nextIndex: number;

    switch (event.key) {
      case "ArrowRight":
        nextIndex = step(isRtl ? -1 : 1);
        break;
      case "ArrowLeft":
        nextIndex = step(isRtl ? 1 : -1);
        break;
      case "ArrowDown":
        nextIndex = step(1);
        break;
      case "ArrowUp":
        nextIndex = step(-1);
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = enabledTabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextTab = enabledTabs[nextIndex];
    if (!nextTab) return;

    selectTab(nextTab.value);
    focusTab(nextTab.value);
  };



  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        aria-orientation="horizontal"
        className={["flex flex-wrap gap-2", listClassName].filter(Boolean).join(" ")}
        onKeyDown={handleKeyDown}
      >
        {items.map((item) => {
          const isSelected = item.value === selectedItem?.value;

          return (
            <button
              key={item.value}
              ref={(node) => {
                if (node) {
                  tabRefs.current.set(item.value, node);
                } else {
                  tabRefs.current.delete(item.value);
                }
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.value}`}
              aria-selected={isSelected}
              aria-controls={`${baseId}-panel-${item.value}`}
              tabIndex={isSelected ? 0 : -1}
              disabled={item.disabled}
              onClick={() => selectTab(item.value)}
              className={[
                TAB_BASE_CLASSES,
                isSelected
                  ? "bg-orange-600 text-white hover:bg-orange-700"
                  : "bg-white text-gray-700 hover:bg-gray-50",
                tabClassName,
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {items.map((item) => {
        const isSelected = item.value === selectedItem?.value;

        return (
          <div
            key={item.value}
            role="tabpanel"
            id={`${baseId}-panel-${item.value}`}
            aria-labelledby={`${baseId}-tab-${item.value}`}
            tabIndex={0}
            hidden={!isSelected}
            className={[
              "mt-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500",
              panelClassName,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {item.content}
          </div>
        );
      })}
    </div>
  );
}
