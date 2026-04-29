import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DisputeNavBadge } from "../DisputeNavBadge";

const mockUseDisputeCount = vi.fn();

vi.mock("../../../lib/hooks/useDisputeCount", () => ({
  useDisputeCount: () => mockUseDisputeCount(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DisputeNavBadge", () => {
  it("renders the count when count is greater than 0", () => {
    mockUseDisputeCount.mockReturnValue({ count: 3, displayCount: "3", isLoading: false });
    render(<DisputeNavBadge />);
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("renders '9+' when count exceeds 9", () => {
    mockUseDisputeCount.mockReturnValue({ count: 12, displayCount: "9+", isLoading: false });
    render(<DisputeNavBadge />);
    expect(screen.getByText("9+")).toBeTruthy();
  });

  it("renders nothing when count is 0", () => {
    mockUseDisputeCount.mockReturnValue({ count: 0, displayCount: "0", isLoading: false });
    const { container } = render(<DisputeNavBadge />);
    expect(container.firstChild).toBeNull();
  });

  it("has an aria-label with the count for plural disputes", () => {
    mockUseDisputeCount.mockReturnValue({ count: 5, displayCount: "5", isLoading: false });
    render(<DisputeNavBadge />);
    const badge = screen.getByText("5");
    expect(badge.getAttribute("aria-label")).toBe("5 active disputes");
  });

  it("uses singular 'dispute' in aria-label when count is 1", () => {
    mockUseDisputeCount.mockReturnValue({ count: 1, displayCount: "1", isLoading: false });
    render(<DisputeNavBadge />);
    const badge = screen.getByText("1");
    expect(badge.getAttribute("aria-label")).toBe("1 active dispute");
  });

  it("shows '9+' in badge but reflects real count in aria-label", () => {
    mockUseDisputeCount.mockReturnValue({ count: 15, displayCount: "9+", isLoading: false });
    render(<DisputeNavBadge />);
    const badge = screen.getByText("9+");
    expect(badge.getAttribute("aria-label")).toBe("15 active disputes");
  });
});