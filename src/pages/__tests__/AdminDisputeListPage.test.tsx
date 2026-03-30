import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import AdminDisputeListPage from "../AdminDisputeListPage";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const mockDisputes = [
  {
    id: "dispute-1",
    pet: { id: "p1", name: "Max" },
    adopter: { id: "a1", name: "Alice" },
    shelter: { id: "s1", name: "Shelter A" },
    status: "open",
    isOverdue: true,
    createdAt: "2026-03-24T10:00:00.000Z",
  },
  {
    id: "dispute-2",
    pet: { id: "p2", name: "Bella" },
    adopter: { id: "a2", name: "Bob" },
    shelter: { id: "s2", name: "Shelter B" },
    status: "resolved",
    isOverdue: false,
    createdAt: "2026-03-25T10:00:00.000Z",
  }
];

const mockServer = setupServer(
  http.get("*/disputes", ({ request }) => {
    const url = new URL(request.url);
    const overdue = url.searchParams.get("overdue");
    const status = url.searchParams.get("status");
    
    let results = mockDisputes;
    
    if (status && status !== "all") {
      results = results.filter(d => d.status === status);
    }
    if (overdue === "true") {
      results = results.filter(d => d.isOverdue);
    }
    
    return HttpResponse.json({ data: results });
  })
);

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }, // disable retries for testing
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("AdminDisputeListPage", () => {
  it("renders the table with disputes initially", async () => {
    renderWithProviders(<AdminDisputeListPage />);

    // Wait for the table data to load
    await waitFor(() => {
      expect(screen.getByText("Max")).toBeTruthy();
    });

    expect(screen.getByText("Bella")).toBeTruthy();
  });

  it("SLA filter shows only breached items", async () => {
    renderWithProviders(<AdminDisputeListPage />);

    await waitFor(() => {
      expect(screen.getByText("Max")).toBeTruthy();
      expect(screen.getByText("Bella")).toBeTruthy();
    });

    // Click the SLA Breached toggle
    const checkbox = screen.getByRole("checkbox", { hidden: true }); // hidden because sr-only class
    fireEvent.click(checkbox);

    // Should re-fetch and display only "Max"
    await waitFor(() => {
      expect(screen.getByText("Max")).toBeTruthy();
      expect(screen.queryByText("Bella")).toBeNull();
    });
  });

  it("Display empty state when filter combinations yield no results", async () => {
    renderWithProviders(<AdminDisputeListPage />);

    await waitFor(() => {
      expect(screen.getByText("Max")).toBeTruthy();
    });

    // Both "Closed" (which we have 0 of) and "SLA Breached"
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "closed" } });

    // Wait and check for the EmptyState
    await waitFor(() => {
      expect(screen.queryByText("Max")).toBeNull();
      expect(screen.getByText("No disputes found")).toBeTruthy();
    });
  });
});
