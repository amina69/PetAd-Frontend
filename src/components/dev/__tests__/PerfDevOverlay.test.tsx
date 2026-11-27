import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { PerfDevOverlay } from "../PerfDevOverlay";
import {
  __resetPerfForTests,
  PERF_MEASURES,
  startPerfMeasure,
} from "../../../lib/perf";

describe("PerfDevOverlay", () => {
  beforeEach(() => {
    localStorage.clear();
    __resetPerfForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    localStorage.clear();
    __resetPerfForTests();
  });

  it("does not render when disabled outside dev mode", () => {
    vi.stubEnv("DEV", false);
    render(<PerfDevOverlay />);
    expect(screen.queryByTestId("perf-dev-overlay")).toBeNull();
  });

  it("renders when enabled via forceVisible", () => {
    render(<PerfDevOverlay forceVisible />);
    expect(screen.getByTestId("perf-dev-overlay")).toBeInTheDocument();
    expect(screen.getByText("⚡ Perf Overlay")).toBeInTheDocument();
  });

  it("renders when enabled via localStorage flag", () => {
    vi.stubEnv("DEV", false);
    localStorage.setItem("perf_overlay", "true");
    render(<PerfDevOverlay />);
    expect(screen.getByTestId("perf-dev-overlay")).toBeInTheDocument();
  });

  it("displays empty state when no measures are recorded", () => {
    render(<PerfDevOverlay forceVisible />);
    expect(screen.getByTestId("perf-overlay-empty")).toHaveTextContent("No timings recorded yet");
  });

  it("displays recorded performance measures and updates in real-time", () => {
    render(<PerfDevOverlay forceVisible />);

    act(() => {
      const end = startPerfMeasure(PERF_MEASURES.ADOPTION_SUBMIT);
      end();
    });

    expect(screen.getByTestId(`perf-measure-${PERF_MEASURES.ADOPTION_SUBMIT}`)).toBeInTheDocument();
    expect(screen.getByTestId(`perf-duration-${PERF_MEASURES.ADOPTION_SUBMIT}`)).toBeInTheDocument();
  });

  it("clears measures when the Clear button is clicked", () => {
    const end = startPerfMeasure(PERF_MEASURES.DOCUMENT_UPLOAD);
    end();

    render(<PerfDevOverlay forceVisible />);
    expect(screen.getByTestId(`perf-measure-${PERF_MEASURES.DOCUMENT_UPLOAD}`)).toBeInTheDocument();

    const clearButton = screen.getByTestId("perf-overlay-clear");
    fireEvent.click(clearButton);

    expect(screen.getByTestId("perf-overlay-empty")).toBeInTheDocument();
    expect(screen.queryByTestId(`perf-measure-${PERF_MEASURES.DOCUMENT_UPLOAD}`)).toBeNull();
  });

  it("collapses and expands when toggle button is clicked", () => {
    render(<PerfDevOverlay forceVisible />);

    const toggleButton = screen.getByTestId("perf-overlay-toggle");
    expect(toggleButton).toHaveTextContent("Collapse");

    // Click to collapse
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveTextContent("Expand");
    expect(screen.queryByTestId("perf-overlay-empty")).toBeNull();

    // Click to expand again
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveTextContent("Collapse");
    expect(screen.getByTestId("perf-overlay-empty")).toBeInTheDocument();
  });
});
