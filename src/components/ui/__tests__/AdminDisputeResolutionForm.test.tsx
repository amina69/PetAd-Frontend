import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminDisputeResolutionForm } from "../AdminDisputeResolutionForm";

// ─── Mock the mutation hook ───────────────────────────────────────────────────

const mockMutate = vi.fn();

vi.mock("../../../hooks/useMutateResolveDispute", () => ({
  useMutateResolveDispute: ({
    onSuccess,
    onError,
  }: {
    onSuccess?: () => void;
    onError?: (msg: string) => void;
  }) => ({
    mutateResolveDispute: (payload: unknown) => mockMutate(payload, { onSuccess, onError }),
    isPending: false,
    isError: false,
    error: null,
  }),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderForm(props?: Partial<React.ComponentProps<typeof AdminDisputeResolutionForm>>) {
  const client = makeClient();
  return render(
    <QueryClientProvider client={client}>
      <AdminDisputeResolutionForm
        disputeId="dispute-001"
        adoptionId="adoption-002"
        totalXlm={500}
        adminId="admin-1"
        {...props}
      />
    </QueryClientProvider>,
  );
}

function fillAndAdvance() {
  // Resolution notes are required to enable the Next button
  const textarea = screen.getByLabelText("Resolution notes");
  fireEvent.change(textarea, { target: { value: "Pet health misrepresented." } });

  const nextBtn = screen.getByRole("button", { name: /review resolution/i });
  fireEvent.click(nextBtn);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AdminDisputeResolutionForm", () => {
  beforeEach(() => {
    mockMutate.mockReset();
  });

  it("renders step-1 form by default", () => {
    renderForm();
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Shelter percentage")).toBeInTheDocument();
    expect(screen.getByLabelText("Adopter percentage")).toBeInTheDocument();
  });

  it("shows XLM amounts based on totalXlm prop", () => {
    renderForm({ totalXlm: 500 });
    // 60% default → 300 XLM shelter, 40% → 200 XLM adopter
    expect(screen.getByText("300.00 XLM")).toBeInTheDocument();
    expect(screen.getByText("200.00 XLM")).toBeInTheDocument();
  });

  it("disables Next button when resolution notes are empty", () => {
    renderForm();
    const btn = screen.getByRole("button", { name: /review resolution/i });
    expect(btn).toBeDisabled();
  });

  it("shows confirmation step after clicking Review Resolution", () => {
    renderForm();
    fillAndAdvance();

    expect(screen.getByText("Step 2 of 2")).toBeInTheDocument();
    // Confirmation shows split summary
    expect(screen.getByText(/shelter/i)).toBeInTheDocument();
    expect(screen.getByText(/300.00 XLM/i)).toBeInTheDocument();
    expect(screen.getByText(/200.00 XLM/i)).toBeInTheDocument();
  });

  it("shows the Stellar irreversibility warning on confirmation step", () => {
    renderForm();
    fillAndAdvance();
    expect(
      screen.getByText(/This will release the escrow on Stellar/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/This cannot be undone/i)).toBeInTheDocument();
  });

  it("goes back to form step when Back is clicked", () => {
    renderForm();
    fillAndAdvance();
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
  });

  it("calls mutateResolveDispute with correct params on confirm", async () => {
    renderForm();
    fillAndAdvance();

    fireEvent.click(screen.getByRole("button", { name: /confirm & release escrow/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          shelterPct: 60,
          adopterPct: 40,
          resolution: "Pet health misrepresented.",
          resolvedBy: "admin-1",
        }),
        expect.anything(),
      );
    });
  });

  it("recalculates adopter pct when shelter pct changes", () => {
    renderForm({ totalXlm: 1000 });
    const shelterInput = screen.getByLabelText("Shelter percentage");
    fireEvent.change(shelterInput, { target: { value: "70" } });
    // 30% of 1000 = 300
    expect(screen.getByText("300.00 XLM")).toBeInTheDocument();
  });
});
