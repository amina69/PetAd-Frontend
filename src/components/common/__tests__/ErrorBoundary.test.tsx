import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "../ErrorBoundary";

const captureError = vi.hoisted(() => vi.fn());

vi.mock("../../../lib/errorTracking", () => ({ captureError }));

function Boom(): never {
  throw new Error("render failed for jane@example.com");
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("shows a fallback and reports the error", () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    expect(captureError).toHaveBeenCalledTimes(1);
    expect(captureError.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it("renders a custom fallback when provided", () => {
    render(
      <ErrorBoundary fallback={<p>Custom fallback</p>}>
        <Boom />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Custom fallback")).toBeInTheDocument();
  });

  it("lets the user retry after an error", () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    // The broken child throws again, so the boundary reports a second time
    // rather than leaving a blank page.
    expect(captureError).toHaveBeenCalledTimes(2);
  });
});
