import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import CustodyTimelinePage from "../CustodyTimelinePage";
import { useCustodyTimeline } from "../../lib/hooks/useCustodyTimeline";
import { useCustodyDetails } from "../../lib/hooks/useCustodyDetails";
import { server } from "../../mocks/server";
import type { CustodyDetails } from "../../types/adoption";

vi.mock("../../lib/hooks/useCustodyTimeline", () => ({
  useCustodyTimeline: vi.fn(),
}));

vi.mock("../../lib/hooks/useCustodyDetails", () => ({
  useCustodyDetails: vi.fn(),
}));

const CUSTODY_DETAILS: CustodyDetails = {
  id: "custody-1",
  status: "ACTIVE",
  petId: "pet-1",
  custodianId: "user-1",
  ownerId: "user-2",
  startDate: "2026-03-25T10:00:00Z",
  escrowId: "escrow-001",
  createdAt: "2026-03-25T10:00:00Z",
  updatedAt: "2026-03-25T10:10:00Z",
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/custody/custody-1/timeline"]}>
        <Routes>
          <Route
            path="/custody/:custodyId/timeline"
            element={<CustodyTimelinePage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("CustodyTimelinePage — payment status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCustodyTimeline).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
  });

  it("reuses the adoption payment status panel for the custody escrow", async () => {
    vi.mocked(useCustodyDetails).mockReturnValue({
      data: CUSTODY_DETAILS,
      isLoading: false,
      isError: false,
    });
    server.use(
      http.get("/api/escrow/:id", () => HttpResponse.json({ status: "FUNDED" })),
    );

    renderPage();

    expect(await screen.findByTestId("escrow-status-panel")).toBeInTheDocument();
    expect(screen.getByTestId("escrow-status-badge")).toHaveTextContent(
      "Payment held",
    );
  });

  it("does not render the panel when the custody has no escrow", () => {
    vi.mocked(useCustodyDetails).mockReturnValue({
      data: { ...CUSTODY_DETAILS, escrowId: null },
      isLoading: false,
      isError: false,
    });

    renderPage();

    expect(screen.queryByTestId("escrow-status-panel")).not.toBeInTheDocument();
  });
});
