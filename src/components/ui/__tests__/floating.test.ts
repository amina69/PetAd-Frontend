import { describe, expect, it } from "vitest";
import {
  computePosition,
  flipPlacement,
  parsePlacement,
  type Placement,
} from "../floating";

const viewport = { width: 1000, height: 800 };

describe("positioning helpers", () => {
  it("parses placements and flips to the opposite side", () => {
    expect(parsePlacement("bottom-start")).toEqual({ side: "bottom", align: "start" });
    expect(parsePlacement("top")).toEqual({ side: "top", align: "center" });
    expect(flipPlacement("bottom-start")).toBe("top-start");
    expect(flipPlacement("left")).toBe("right");
  });

  it("keeps the preferred placement when it fits", () => {
    const result = computePosition(
      { top: 100, left: 100, width: 100, height: 40 },
      { width: 200, height: 80 },
      "bottom-start",
      viewport,
    );

    expect(result).toEqual({ top: 148, left: 100, placement: "bottom-start" });
  });

  it("flips vertically when the preferred side overflows", () => {
    const result = computePosition(
      { top: 50, left: 100, width: 100, height: 40 },
      { width: 300, height: 300 },
      "top",
      viewport,
    );

    expect(result.placement).toBe("bottom");
    expect(result.top).toBe(98);
  });

  it("flips from bottom to top near the bottom edge", () => {
    const result = computePosition(
      { top: 700, left: 100, width: 100, height: 40 },
      { width: 200, height: 80 },
      "bottom-start",
      viewport,
    );

    expect(result.placement).toBe("top-start");
    expect(result.top).toBe(612);
  });

  it("shifts horizontally to stay inside the viewport", () => {
    const result = computePosition(
      { top: 100, left: 950, width: 40, height: 40 },
      { width: 200, height: 80 },
      "bottom-start",
      viewport,
    );

    expect(result.left).toBe(792);
  });

  it("never returns negative coordinates even when nothing fits", () => {
    const result = computePosition(
      { top: 300, left: 20, width: 100, height: 40 },
      { width: 900, height: 900 },
      "bottom" as Placement,
      viewport,
    );

    expect(result.top).toBeGreaterThanOrEqual(8);
    expect(result.left).toBeGreaterThanOrEqual(8);
  });
});
