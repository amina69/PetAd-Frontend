import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminDisputeResolutionForm from "../components/disputes/AdminDisputeResolutionForm";

// Mock hook
vi.mock("../hooks/useResolveDispute", () => ({
  useResolveDispute: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

// Helper wrapper
const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe("AdminDisputeResolutionForm", () => {
  test("shows confirmation step before submitting", () => {
    renderWithClient(
      <AdminDisputeResolutionForm disputeId="1" totalAmount={500} />
    );

    fireEvent.click(screen.getByText("Continue"));

    expect(
      screen.getByText(/This will release the escrow/i)
    ).toBeInTheDocument();
  });

  test("renders correct split values", () => {
    renderWithClient(
      <AdminDisputeResolutionForm disputeId="1" totalAmount={500} />
    );

    fireEvent.click(screen.getByText("Continue"));

    expect(screen.getByText(/300 XLM/)).toBeInTheDocument();
    expect(screen.getByText(/200 XLM/)).toBeInTheDocument();
  });
});