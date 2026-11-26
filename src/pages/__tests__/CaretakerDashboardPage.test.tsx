import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CaretakerDashboardPage from "../CaretakerDashboardPage";

const ROUTE = "/caretaker/dashboard";

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[ROUTE]}>
        <Routes>
          <Route path={ROUTE} element={<CaretakerDashboardPage />} />
          <Route path="*" element={<div>Unexpected navigation</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("CaretakerDashboardPage", () => {
  it("renders the four dashboard widgets with live and fixture data", async () => {
    renderDashboard();

    // 1. Incoming custody requests awaiting action (GET /api/approvals, MSW)
    expect(
      await screen.findByTestId("custody-requests-widget"),
    ).toBeInTheDocument();
    expect(await screen.findByTestId("custody-request-app-1")).toBeInTheDocument();
    expect(screen.getByTestId("custody-request-app-4")).toBeInTheDocument();
    expect(screen.getByTestId("custody-requests-widget-count")).toHaveTextContent(
      "2",
    );

    // 2. Active arrangements with days remaining
    expect(
      await screen.findByTestId("active-arrangements-widget"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("days-remaining-custody-1")).toHaveTextContent(
      "3 days left",
    );
    expect(screen.getByTestId("days-remaining-custody-3")).toHaveTextContent(
      "1 day left",
    );

    // 3. Upcoming handovers (arrangements ordered by end date)
    expect(
      await screen.findByTestId("upcoming-handovers-widget"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("upcoming-handover-custody-3")).toBeInTheDocument();

    // 4. Open disputes (GET /api/disputes?status=open, MSW)
    expect(await screen.findByTestId("open-disputes-widget")).toBeInTheDocument();
    expect(await screen.findByTestId("open-dispute-dispute-001")).toBeInTheDocument();
    expect(screen.getByTestId("open-dispute-dispute-004")).toBeInTheDocument();
  });

  it("opens the Approval modal in place from a dashboard quick action", async () => {
    renderDashboard();

    const pathnameBefore = window.location.pathname;

    fireEvent.click(await screen.findByTestId("review-request-app-1"));

    const modal = await screen.findByTestId("approval-modal");
    expect(modal).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByTestId("modal-pet-name")).toHaveTextContent("Buddy");

    // Still on the dashboard — no route change, widget still mounted.
    expect(screen.getByTestId("custody-requests-widget")).toBeInTheDocument();
    expect(screen.queryByText("Unexpected navigation")).not.toBeInTheDocument();
    expect(window.location.pathname).toBe(pathnameBefore);
  });

  it("updates the requests widget after approving, without leaving the page", async () => {
    renderDashboard();

    const pathnameBefore = window.location.pathname;

    expect(await screen.findByTestId("custody-request-app-1")).toBeInTheDocument();
    expect(screen.getByTestId("custody-requests-widget-count")).toHaveTextContent(
      "2",
    );

    fireEvent.click(await screen.findByTestId("review-request-app-1"));
    fireEvent.click(await screen.findByTestId("approve-request"));

    // Widget updates in place: the decided request leaves the awaiting list and
    // the count drops, all while the dashboard stays mounted.
    await waitFor(() => {
      expect(
        screen.queryByTestId("custody-request-app-1"),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByTestId("custody-requests-widget-count")).toHaveTextContent(
      "1",
    );
    expect(screen.getByTestId("custody-request-app-4")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByTestId("approval-modal")).not.toBeInTheDocument();
    });
    expect(screen.getByTestId("dashboard-notice")).toHaveTextContent(/approved/i);

    expect(screen.getByTestId("custody-requests-widget")).toBeInTheDocument();
    expect(screen.queryByText("Unexpected navigation")).not.toBeInTheDocument();
    expect(window.location.pathname).toBe(pathnameBefore);
  });

  it("validates the rejection reason and updates the widget on rejection", async () => {
    renderDashboard();

    fireEvent.click(await screen.findByTestId("review-request-app-4"));

    fireEvent.click(await screen.findByTestId("reject-request"));
    fireEvent.click(await screen.findByTestId("submit-rejection"));

    // rejectRequestSchema requires at least 20 characters.
    expect(await screen.findByTestId("rejection-reason-error")).toHaveTextContent(
      "at least 20 characters",
    );
    expect(screen.getByTestId("approval-modal")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("rejection-reason"), {
      target: { value: "Owner cannot provide the required vaccination records." },
    });
    fireEvent.click(await screen.findByTestId("submit-rejection"));

    await waitFor(() => {
      expect(
        screen.queryByTestId("custody-request-app-4"),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByTestId("custody-requests-widget-count")).toHaveTextContent(
      "1",
    );
    await waitFor(() => {
      expect(screen.queryByTestId("approval-modal")).not.toBeInTheDocument();
    });
    expect(screen.getByTestId("dashboard-notice")).toHaveTextContent(/rejected/i);
  });
});
