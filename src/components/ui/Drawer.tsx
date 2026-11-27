import { DialogBase, type DialogBaseProps } from "./Modal";

export type DrawerSide = "start" | "end";

export interface DrawerProps extends DialogBaseProps {
  /** Logical side of the viewport the panel slides in from. Defaults to `end`. */
  side?: DrawerSide;
  /** Panel width. */
  widthClassName?: string;
}

/**
 * Side sheet built on the same accessibility contract as `Modal`: focus trap,
 * focus restoration, scroll lock, Escape/backdrop dismissal, `aria-modal` and
 * nested-overlay handling.
 *
 * @example
 * <Drawer open={open} onClose={close} title="Filters" side="end">
 *   …
 * </Drawer>
 */
export function Drawer({
  side = "end",
  widthClassName = "w-full max-w-md",
  panelClassName,
  overlayClassName,
  ...props
}: DrawerProps) {
  return (
    <DialogBase
      {...props}
      variant="sheet"
      panelClassName={[
        "absolute inset-y-0 h-full max-h-none rounded-none",
        side === "start" ? "start-0" : "end-0",
        widthClassName,
        panelClassName,
      ]
        .filter(Boolean)
        .join(" ")}
      overlayClassName={overlayClassName}
    />
  );
}
