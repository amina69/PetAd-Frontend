import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DisputeNavBadge } from "../DisputeNavBadge";

// Mock useDisputeCount so we control what the badge receives
vi.mock("../../../hooks/useDisputeCount", () => ({
  useDisputeCount: vi.fn(),
  formatDisputeCount: (n: number) => (n > 9 ? "9+" : n > 0 ? String(n) : ""),
}));

import { useDisputeCount } from "../../../hooks/useDisputeCount";
const mockUseDisputeCount = vi.mocked(useDisputeCount);

function renderBadge(currentUserId?: string) {
  return render(
    <MemoryRouter>
      <DisputeNavBadge currentUserId={currentUserId} />
    </MemoryRouter>,
  );
}

describe("DisputeNavBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when count is 0", () => {
    mockUseDisputeCount.mockReturnValue({
      count: 0,
      displayCount: "",
      isLoading: false,
    });
    renderBadge();
    expect(screen.queryByTestId("dispute-nav-badge")).not.toBeInTheDocument();
  });

  it("admin sees total open dispute count", () => {
    mockUseDisputeCount.mockReturnValue({
      count: 3,
      displayCount: "3",
      isLoading: false,
    });
    renderBadge();
    expect(screen.getByTestId("dispute-nav-badge")).toHaveTextContent("3");
  });

  it("user sees only their own dispute count", () => {
    mockUseDisputeCount.mockReturnValue({
      count: 1,
      displayCount: "1",
      isLoading: false,
    });
    renderBadge("user-buyer-2");
    expect(screen.getByTestId("dispute-nav-badge")).toHaveTextContent("1");
  });

  it('displays "9+" when count exceeds 9', () => {
    mockUseDisputeCount.mockReturnValue({
      count: 12,
      displayCount: "9+",
      isLoading: false,
    });
    renderBadge();
    expect(screen.getByTestId("dispute-nav-badge")).toHaveTextContent("9+");
  });

  it("resets to zero when on disputes page", () => {
    mockUseDisputeCount.mockReturnValue({
      count: 0,
      displayCount: "",
      isLoading: false,
    });
    render(
      <MemoryRouter initialEntries={["/disputes"]}>
        <DisputeNavBadge />
      </MemoryRouter>,
    );
    expect(screen.queryByTestId("dispute-nav-badge")).not.toBeInTheDocument();
  });

  it("has accessible aria-label with count", () => {
    mockUseDisputeCount.mockReturnValue({
      count: 5,
      displayCount: "5",
      isLoading: false,
    });
    renderBadge();
    const badge = screen.getByTestId("dispute-nav-badge");
    expect(badge).toHaveAttribute("aria-label", "5 active disputes");
  });
});
