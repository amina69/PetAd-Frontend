import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, describe, beforeEach, vi } from "vitest";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const { mockGetAdminApprovalQueue, mockNavigate } = vi.hoisted(() => ({
  mockGetAdminApprovalQueue: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../api/adoptionService", () => ({
  adoptionService: {
    getAdminApprovalQueue: (...args: any[]) => mockGetAdminApprovalQueue(...args),
  },
}));

import ShelterApprovalQueuePage from "../ShelterApprovalQueuePage";

describe("ShelterApprovalQueuePage", () => {
  const renderWithProviders = (ui: React.ReactElement) => {
    const testQueryClient = new QueryClient({
      defaultOptions: { 
        queries: { retry: false, gcTime: 0, staleTime: 0 } 
      },
    });

    return render(
      <QueryClientProvider client={testQueryClient}>
        <BrowserRouter>{ui}</BrowserRouter>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mockNavigate.mockClear();
  });

  it("renders the shelter approval queue with items", async () => {
    mockGetAdminApprovalQueue.mockResolvedValue({
      items: [
        { 
          id: "1", 
          pet: "Buddy", 
          adopter: "John Doe", 
          submitted: "2026-04-23T00:00:00Z", 
          daysWaiting: 4 
        }
      ],
      nextCursor: undefined,
    });

    renderWithProviders(<ShelterApprovalQueuePage />);

    const petName = await screen.findByText(/Buddy/i);
    expect(petName).toBeInTheDocument();
  });

  it("shows empty state when no items", async () => {
    mockGetAdminApprovalQueue.mockResolvedValue({
      items: [],
      nextCursor: undefined,
    });

    renderWithProviders(<ShelterApprovalQueuePage />);
    
    const emptyMsg = await screen.findByText(/No pending approvals/i);
    expect(emptyMsg).toBeInTheDocument();
  });

  it("navigates on row click", async () => {
    const user = userEvent.setup();
    mockGetAdminApprovalQueue.mockResolvedValue({
      items: [{ id: "123", pet: "Buddy", adopter: "John", submitted: "2026-04-23T00:00:00Z", daysWaiting: 1 }],
      nextCursor: undefined,
    });

    renderWithProviders(<ShelterApprovalQueuePage />);
    
    const petCell = await screen.findByText(/Buddy/i);
    await user.click(petCell.closest("tr")!);
    
    expect(mockNavigate).toHaveBeenCalledWith("/adoption/123#approvals");
  });
});
