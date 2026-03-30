import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { expect, it, describe, beforeEach } from "vitest";
import AdminApprovalQueuePage from "../AdminApprovalQueuePage";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

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
  });

  it("renders the approval queue with items", async () => {
    render(<AdminApprovalQueuePage />, { wrapper });
    
    expect(screen.getByText(/Approval Queue/i)).toBeInTheDocument();

    expect(await screen.findByText("Buddy (Golden Retriever)", {}, { timeout: 3000 })).toBeInTheDocument();
    expect(await screen.findByText("Luna (Siamese Cat)", {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it("filters overdue items when toggle is clicked", async () => {
    render(<AdminApprovalQueuePage />, { wrapper });

    expect(await screen.findByText("Luna (Siamese Cat)", {}, { timeout: 3000 })).toBeInTheDocument();

    const toggle = screen.getByText(/Show overdue only/i);
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(screen.queryByText("Luna (Siamese Cat)")).not.toBeInTheDocument();
      expect(screen.getByText("Buddy (Golden Retriever)")).toBeInTheDocument();
      expect(screen.getAllByText(/SLA Breached/i).length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });
});
