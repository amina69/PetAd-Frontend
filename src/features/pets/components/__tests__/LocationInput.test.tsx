import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocationInput } from "../LocationInput";

describe("LocationInput", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requests geolocation only after clicking and gives a text fallback on denial", () => {
    const getCurrentPosition = vi.fn(
      (_success: PositionCallback, error: PositionErrorCallback) => {
        error({
          code: 1,
          message: "Permission denied",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
      },
    );
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition },
    });

    render(
      <LocationInput
        location=""
        radius={10}
        onLocationChange={vi.fn()}
        onRadiusChange={vi.fn()}
        onCoordinatesChange={vi.fn()}
      />,
    );

    expect(getCurrentPosition).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Use my location" }));
    expect(getCurrentPosition).toHaveBeenCalledOnce();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Location access was declined. Enter a city or area instead.",
    );
  });
});
