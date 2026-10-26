import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdoptionStatusPage from "../AdoptionStatusPage";
import { useAdoptionStatus } from "../../features/adoption/hooks/useAdoptionStatus";
import { getAdoptionStatusConfig } from "../../features/adoption/constants/statusConfig";
import type { UseAdoptionStatusResult } from "../../features/adoption/hooks/useAdoptionStatus";

vi.mock("../../features/adoption/hooks/useAdoptionStatus", () => ({
  useAdoptionStatus: vi.fn(),
}));

function mockHookResult(
  overrides: Partial<UseAdoptionStatusResult> = {},
): UseAdoptionStatusResult {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    isForbidden: false,
    isNotFound: false,
    isTerminal: false,
    statusConfig: undefined,
    refetch: vi.fn(),
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/adoption/adoption-rejected/status"]}>
      <Routes>
        <Route
          path="/adoption/:adoptionId/status"
          element={<AdoptionStatusPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdoptionStatusPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the loading skeleton while fetching", () => {
    vi.mocked(useAdoptionStatus).mockReturnValue(
      mockHookResult({ isLoading: true }),
    );

    renderPage();

    expect(screen.getByTestId("status-loading")).toBeInTheDocument();
  });

  it("shows the decision reason when the adoption was rejected with one (acceptance criterion)", () => {
    vi.mocked(useAdoptionStatus).mockReturnValue(
      mockHookResult({
        data: {
          id: "adoption-rejected",
          status: "REJECTED",
          decisionReason:
            "The adopter could not provide a verified veterinary reference.",
        },
        isTerminal: true,
        statusConfig: getAdoptionStatusConfig("REJECTED"),
      }),
    );

    renderPage();

    expect(screen.getByTestId("decision-reason")).toHaveTextContent(
      "The adopter could not provide a verified veterinary reference.",
    );
    expect(screen.getByTestId("status-summary")).toHaveTextContent("Rejected");
    expect(screen.getByTestId("status-summary")).toHaveTextContent("Final");
  });

  it("does not render a reason box for a rejection without a reason", () => {
    vi.mocked(useAdoptionStatus).mockReturnValue(
      mockHookResult({
        data: { id: "adoption-rejected", status: "REJECTED" },
        isTerminal: true,
        statusConfig: getAdoptionStatusConfig("REJECTED"),
      }),
    );

    renderPage();

    expect(screen.queryByTestId("decision-reason")).not.toBeInTheDocument();
  });

  it("hides the polling indicator once the status is terminal", () => {
    vi.mocked(useAdoptionStatus).mockReturnValue(
      mockHookResult({
        data: { id: "a1", status: "COMPLETED" },
        isTerminal: true,
        statusConfig: getAdoptionStatusConfig("COMPLETED"),
      }),
    );

    renderPage();

    expect(screen.queryByTestId("polling-indicator")).not.toBeInTheDocument();
    expect(screen.getByTestId("status-summary")).toHaveTextContent("Completed");
  });

  it("shows the polling indicator while the status is non-terminal", () => {
    vi.mocked(useAdoptionStatus).mockReturnValue(
      mockHookResult({
        data: { id: "a1", status: "PENDING" },
        statusConfig: getAdoptionStatusConfig("PENDING"),
      }),
    );

    renderPage();

    expect(screen.getByTestId("polling-indicator")).toBeInTheDocument();
  });

  it("renders an error state with a retry affordance", () => {
    const refetch = vi.fn();
    vi.mocked(useAdoptionStatus).mockReturnValue(
      mockHookResult({ isError: true, refetch }),
    );

    renderPage();

    const retry = screen.getByRole("button", { name: "Retry" });
    retry.click();
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("renders a not-found state for unknown adoptions", () => {
    vi.mocked(useAdoptionStatus).mockReturnValue(
      mockHookResult({ isNotFound: true }),
    );

    renderPage();

    expect(screen.getByText("Adoption not found")).toBeInTheDocument();
  });
});
