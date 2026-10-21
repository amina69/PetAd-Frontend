import { useEffect, type RefObject } from "react";

interface UseDialogFocusOptions {
  isOpen: boolean;
  containerRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  closeOnEscape?: boolean;
}

/** Focuses, traps, and restores focus for an open modal dialog. */
export function useDialogFocus({
  isOpen,
  containerRef,
  onClose,
  closeOnEscape = true,
}: UseDialogFocusOptions) {
  useEffect(() => {
    if (!isOpen) return;

    const previous = document.activeElement as HTMLElement | null;
    const container = containerRef.current;
    if (!container) return;

    const focusable = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute("aria-hidden"));

    requestAnimationFrame(() => (focusable()[0] ?? container).focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const elements = focusable();
      if (elements.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previous?.focus();
    };
  }, [closeOnEscape, containerRef, isOpen, onClose]);
}
