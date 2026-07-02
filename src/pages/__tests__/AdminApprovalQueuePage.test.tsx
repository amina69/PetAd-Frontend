import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { expect, it, describe, beforeEach, vi } from "vitest";
import AdminApprovalQueuePage from "../AdminApprovalQueuePage";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { adoptionService } from "../../api/adoptionService";

vi.mock("../../api/adoptionService", () => ({
  adoptionService: {
    getAdminApprovalQueue: vi.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>{children}</BrowserRouter>
  </QueryClientProvider>
);

describe("AdminApprovalQueuePage", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("renders the approval queue with items", async () => {
    vi.mocked(adoptionService.getAdminApprovalQueue).mockResolvedValue({
      items: [
        { id: "1", shelter: "Happy Paws", pet: "Buddy (Golden Retriever)", adopter: "John", submitted: "2026-04-23", shelterApproved: true, daysWaiting: 1, isOverdue: false },
        { id: "2", shelter: "Rescue League", pet: "Luna (Siamese Cat)", adopter: "Jane", submitted: "2026-04-20", shelterApproved: false, daysWaiting: 4, isOverdue: true },
      ],
      nextCursor: undefined,
    });

    render(<AdminApprovalQueuePage />, { wrapper });
    
    expect(screen.getByText(/Approval Queue/i)).toBeInTheDocument();

    expect(await screen.findByText("Buddy (Golden Retriever)", {}, { timeout: 3000 })).toBeInTheDocument();
    expect(await screen.findByText("Luna (Siamese Cat)", {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it("filters overdue items when toggle is clicked", async () => {
    vi.mocked(adoptionService.getAdminApprovalQueue).mockResolvedValue({
      items: [
        { id: "1", shelter: "Happy Paws", pet: "Buddy (Golden Retriever)", adopter: "John", submitted: "2026-04-23", shelterApproved: true, daysWaiting: 1, isOverdue: false },
        { id: "2", shelter: "Rescue League", pet: "Luna (Siamese Cat)", adopter: "Jane", submitted: "2026-04-20", shelterApproved: false, daysWaiting: 4, isOverdue: true },
      ],
      nextCursor: undefined,
    });

    render(<AdminApprovalQueuePage />, { wrapper });

    expect(await screen.findByText("Luna (Siamese Cat)", {}, { timeout: 3000 })).toBeInTheDocument();

    const toggle = screen.getByText(/Show overdue only/i);

    // When the toggle is clicked, the query re-runs specifically for overdue items.
    vi.mocked(adoptionService.getAdminApprovalQueue).mockResolvedValue({
      items: [
        { id: "2", shelter: "Rescue League", pet: "Luna (Siamese Cat)", adopter: "Jane", submitted: "2026-04-20", shelterApproved: false, daysWaiting: 4, isOverdue: true },
      ],
      nextCursor: undefined,
    });

    fireEvent.click(toggle);

    await waitFor(() => {
      expect(screen.queryByText("Buddy (Golden Retriever)")).not.toBeInTheDocument();
      expect(screen.getByText("Luna (Siamese Cat)")).toBeInTheDocument();
      expect(screen.getAllByText(/SLA Breached/i).length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });
});
