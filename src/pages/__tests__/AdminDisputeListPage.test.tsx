import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AdminDisputeListPage from "../AdminDisputeListPage";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";

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
  },
  {
    id: "dispute-3",
    pet: { id: "p3", name: "Coco" },
    adopter: { id: "a3", name: "Carol" },
    shelter: { id: "s3", name: "Shelter C" },
    status: "under_review",
    isOverdue: true,
    createdAt: "2026-03-26T10:00:00.000Z",
  }
];

const disputesHandler = http.get("*/disputes", ({ request }) => {
    const url = new URL(request.url);
    const overdue = url.searchParams.get("overdue");
    const status = url.searchParams.get("status");
    const cursor = url.searchParams.get("cursor");
    
    let results = mockDisputes;
    
    if (status && status !== "all") {
      results = results.filter(d => d.status === status);
    }
    if (overdue === "true") {
      results = results.filter(d => d.isOverdue);
    }

    const pageSize = 2;
    let startIndex = 0;
    if (cursor) {
      const index = results.findIndex((d) => d.id === cursor);
      if (index !== -1) {
        startIndex = index + 1;
      }
    }

    const pageData = results.slice(startIndex, startIndex + pageSize);
    const lastItem = pageData[pageData.length - 1];
    const nextCursor =
      startIndex + pageSize < results.length && lastItem ? lastItem.id : undefined;
    
    return HttpResponse.json({ data: pageData, nextCursor });
  });

beforeEach(() => {
  server.use(disputesHandler);
});

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }, // disable retries for testing
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/admin/disputes"]}>
        <Routes>
          <Route path="/admin/disputes" element={ui} />
          <Route path="/disputes/:id" element={<div>Detail page</div>} />
        </Routes>
      </MemoryRouter>
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

    // Should re-fetch and display only breached rows from the first page
    await waitFor(() => {
      expect(screen.getByText("Max")).toBeTruthy();
      expect(screen.queryByText("Bella")).toBeNull();
    });
  });

  it("shows empty state when filter combination yields no results", async () => {
    renderWithProviders(<AdminDisputeListPage />);

    await waitFor(() => {
      expect(screen.getByText("Max")).toBeTruthy();
    });

    // Select a status that has no mocked data.
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "closed" } });

    // Wait and check for empty state.
    await waitFor(() => {
      expect(screen.queryByText("Max")).toBeNull();
      expect(screen.getByText("No disputes found")).toBeTruthy();
    });
  });

  it("loads next cursor page when clicking Load more", async () => {
    renderWithProviders(<AdminDisputeListPage />);

    await waitFor(() => {
      expect(screen.getByText("Max")).toBeTruthy();
      expect(screen.getByText("Bella")).toBeTruthy();
    });

    const loadMoreButton = screen.getByRole("button", { name: /load more/i });
    fireEvent.click(loadMoreButton);

    await waitFor(() => {
      expect(screen.getByText("Coco")).toBeTruthy();
    });
  });

  it("navigates to detail page when a row is clicked", async () => {
    renderWithProviders(<AdminDisputeListPage />);

    await waitFor(() => {
      expect(screen.getByText("Max")).toBeTruthy();
    });

    fireEvent.click(screen.getByText("dispute-1"));

    await waitFor(() => {
      expect(screen.getByText("Detail page")).toBeTruthy();
    });
  });
});
