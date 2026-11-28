/**
 * Small, dependency-free positioning helpers for floating UI (tooltip,
 * popover, menu). The project does not ship `@floating-ui/react`, so this
 * module implements the two behaviours every primitive needs:
 *
 * - collision detection that flips the panel to the opposite side when it
 *   would overflow the viewport, and
 * - cross-axis shifting that keeps the panel inside the viewport with padding.
 *
 * Coordinates are viewport-relative (`position: fixed`), which keeps the maths
 * simple and avoids drift when the document scrolls.
 */

export type Side = "top" | "bottom" | "left" | "right";
export type Alignment = "start" | "center" | "end";
export type Placement = Side | `${Side}-${Alignment}`;

export interface FloatingRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface FloatingSize {
  width: number;
  height: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export interface ResolvedPosition {
  top: number;
  left: number;
  placement: Placement;
}

export interface ComputePositionOptions {
  /** Gap between the trigger and the panel in pixels. Defaults to 8. */
  offset?: number;
  /** Space kept between the panel and the viewport edges. Defaults to 8. */
  padding?: number;
}

const OPPOSITE_SIDE: Record<Side, Side> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

/** Splits a placement such as `bottom-start` into its side and alignment. */
export function parsePlacement(placement: Placement): {
  side: Side;
  align: Alignment;
} {
  const [side, align] = placement.split("-") as [Side, Alignment | undefined];

  return { side, align: align ?? "center" };
}

/** Returns the placement on the opposite side of `placement`. */
export function flipPlacement(placement: Placement): Placement {
  const { side, align } = parsePlacement(placement);

  return (align === "center" ? OPPOSITE_SIDE[side] : `${OPPOSITE_SIDE[side]}-${align}`) as Placement;
}

function fitsOnSide(
  side: Side,
  trigger: FloatingRect,
  floating: FloatingSize,
  viewport: ViewportSize,
  offset: number,
  padding: number,
): boolean {
  switch (side) {
    case "top":
      return trigger.top - offset - floating.height >= padding;
    case "bottom":
      return trigger.top + trigger.height + offset + floating.height <= viewport.height - padding;
    case "left":
      return trigger.left - offset - floating.width >= padding;
    case "right":
      return trigger.left + trigger.width + offset + floating.width <= viewport.width - padding;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/**
 * Resolves the fixed-position coordinates for a floating panel.
 *
 * The preferred side is used when the panel fits; otherwise it flips to the
 * opposite side. Coordinates are always clamped to the padded viewport so a
 * panel can never be rendered off-screen.
 */
export function computePosition(
  trigger: FloatingRect,
  floating: FloatingSize,
  placement: Placement,
  viewport: ViewportSize,
  { offset = 8, padding = 8 }: ComputePositionOptions = {},
): ResolvedPosition {
  const requested = parsePlacement(placement);
  let side = requested.side;

  if (!fitsOnSide(side, trigger, floating, viewport, offset, padding)) {
    const flipped = OPPOSITE_SIDE[side];

    if (fitsOnSide(flipped, trigger, floating, viewport, offset, padding)) {
      side = flipped;
    }
  }

  const resolvedPlacement = (
    requested.align === "center" ? side : `${side}-${requested.align}`
  ) as Placement;

  let top: number;
  let left: number;

  if (side === "top" || side === "bottom") {
    top = side === "top" ? trigger.top - floating.height - offset : trigger.top + trigger.height + offset;

    if (requested.align === "start") {
      left = trigger.left;
    } else if (requested.align === "end") {
      left = trigger.left + trigger.width - floating.width;
    } else {
      left = trigger.left + trigger.width / 2 - floating.width / 2;
    }
  } else {
    left = side === "left" ? trigger.left - floating.width - offset : trigger.left + trigger.width + offset;

    if (requested.align === "start") {
      top = trigger.top;
    } else if (requested.align === "end") {
      top = trigger.top + trigger.height - floating.height;
    } else {
      top = trigger.top + trigger.height / 2 - floating.height / 2;
    }
  }

  return {
    top: clamp(top, padding, viewport.height - floating.height - padding),
    left: clamp(left, padding, viewport.width - floating.width - padding),
    placement: resolvedPlacement,
  };
}

/** Reads the current viewport size, falling back to 0 in non-browser environments. */
export function getViewportSize(): ViewportSize {
  if (typeof window === "undefined") {
    return { width: 0, height: 0 };
  }

  return { width: window.innerWidth, height: window.innerHeight };
}

/** Converts a DOM element into a viewport-relative rectangle. */
export function toFloatingRect(element: Element): FloatingRect {
  const rect = element.getBoundingClientRect();

  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}
