import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { AdoptionCompleteButton } from "../AdoptionCompleteButton";
import { EscrowFundedBanner } from "../EscrowFundedBanner";
import { getEscrowFundedBannerStorageKey } from "../types";
import { EscrowStatusCard } from "../EscrowStatusCard";
import type { EscrowStatusData } from "../types";
import { SettlementSummaryPage } from "../../../pages/SettlementSummaryPage";
import { useSettlementSummary } from "../../../hooks/useSettlementSummary";
import { useRetrySettlement } from "../../../hooks/useRetrySettlement";
import { useSubmitSignature } from "../../../hooks/useSubmitSignature";
import { useEscrowStatus } from "../../../lib/hooks/useEscrowStatus";

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );

  return {
    ...actual,
    useParams: () => ({ adoptionId: "adoption-1" }),
  };
});

vi.mock("../../../hooks/useSettlementSummary", () => ({
  useSettlementSummary: vi.fn(),
}));

vi.mock("../../../hooks/useRetrySettlement", () => ({
  useRetrySettlement: vi.fn(),
}));

vi.mock("../../../hooks/useSubmitSignature", () => ({
  useSubmitSignature: vi.fn(),
}));

vi.mock("../../../lib/hooks/useEscrowStatus", () => ({
  useEscrowStatus: vi.fn(),
}));

const mockUseSettlementSummary = vi.mocked(useSettlementSummary);
const mockUseRetrySettlement = vi.mocked(useRetrySettlement);
const mockUseSubmitSignature = vi.mocked(useSubmitSignature);
const mockUseEscrowStatus = vi.mocked(useEscrowStatus);

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function renderWithQueryClient(ui: ReactNode) {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

const txHash =
  "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

const fundedEscrow: EscrowStatusData = {
  escrowId: "escrow_123",
  adoptionId: "AD-1001",
  petName: "Milo",
  status: "FUNDED",
  amount: 125,
  currency: "USDC",
  fundedAt: "2026-03-25T10:00:00Z",
  txHash,
};

const settledEscrow: EscrowStatusData = {
  ...fundedEscrow,
  status: "SETTLED",
  settledAt: "2026-03-26T12:00:00Z",
};

beforeEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("EscrowStatusCard", () => {
  it("renders loading skeleton while status is loading", () => {
    renderWithQueryClient(
      <EscrowStatusCard
        escrowId="escrow_loading"
        fetchStatus={() => new Promise(() => undefined)}
      />,
    );

    expect(screen.getByTestId("escrow-status-card-skeleton")).toBeTruthy();
  });

  it("renders funded escrow data", () => {
    renderWithQueryClient(
      <EscrowStatusCard
        escrowId={fundedEscrow.escrowId}
        initialData={fundedEscrow}
      />,
    );

    expect(screen.getByText("Milo")).toBeTruthy();
    expect(screen.getByText("Funded")).toBeTruthy();
    expect(screen.getByText("USDC 125.00 for adoption #AD-1001")).toBeTruthy();
  });

  it("renders settled state messaging", () => {
    renderWithQueryClient(
      <EscrowStatusCard
        escrowId={settledEscrow.escrowId}
        initialData={settledEscrow}
      />,
    );

    expect(screen.getByText("Settled")).toBeTruthy();
    expect(
      screen.getByText(
        "Settlement complete. Polling stops after this terminal state is reached.",
      ),
    ).toBeTruthy();
  });

  it("stops polling after the escrow reaches SETTLED", async () => {
    const fetchStatus = vi
      .fn<() => Promise<EscrowStatusData>>()
      .mockResolvedValueOnce(fundedEscrow)
      .mockResolvedValueOnce(settledEscrow);

    renderWithQueryClient(
      <EscrowStatusCard
        escrowId={fundedEscrow.escrowId}
        fetchStatus={fetchStatus}
        pollingIntervalMs={20}
      />,
    );

    await waitFor(() => expect(fetchStatus).toHaveBeenCalledTimes(1));

    await waitFor(() => expect(fetchStatus).toHaveBeenCalledTimes(2));
    await new Promise((resolve) => setTimeout(resolve, 120));
    expect(fetchStatus).toHaveBeenCalledTimes(2);
  });
});

describe("SettlementSummaryPage", () => {
  beforeEach(() => {
    mockUseRetrySettlement.mockReturnValue({
      mutateRetrySettlement: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    });
    mockUseSubmitSignature.mockReturnValue({
      mutateSubmitSignature: vi.fn(),
      isPending: false,
    });
    mockUseEscrowStatus.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: vi.fn() as any,
    });
  });

  it("renders the full summary with funded data", () => {
    mockUseSettlementSummary.mockReturnValue({
      data: {
        onChainStatus: "SUCCESS",
        confirmations: 12,
        payments: [
          {
            id: "pay-1",
            amount: 125,
            asset: "USDC",
            destination: "GDESTINATION123",
            status: "SUCCESS",
          },
        ],
        stellarExplorerUrl:
          "https://stellar.expert/explorer/testnet/tx/mock_tx_hash",
      },
      isLoading: false,
      isError: false,
      isForbidden: false,
      isNotFound: false,
      error: null,
    });

    renderWithQueryClient(<SettlementSummaryPage isAdmin />);

    expect(screen.getByText("Settlement Summary")).toBeTruthy();
    expect(
      screen.getByText("Confirmed (12 ledger confirmations)"),
    ).toBeTruthy();
    expect(screen.getByText("GDESTINATION123")).toBeTruthy();
    expect(screen.getByText("125.00 USDC")).toBeTruthy();
  });

  it("renders the failed settlement state", () => {
    mockUseSettlementSummary.mockReturnValue({
      data: {
        onChainStatus: "FAILED",
        confirmations: 2,
        payments: [],
        stellarExplorerUrl:
          "https://stellar.expert/explorer/testnet/tx/mock_tx_hash",
      },
      isLoading: false,
      isError: false,
      isForbidden: false,
      isNotFound: false,
      error: null,
    });

    renderWithQueryClient(<SettlementSummaryPage isAdmin />);

    // Use getAllByText and take the first match to avoid "multiple elements found" errors
    expect(screen.getAllByText("Settlement Failed")[0]).toBeTruthy();
    expect(
      screen.getByText(
        "The payout could not be completed. Please review the transaction and retry.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Retry Settlement")).toBeTruthy();
  });

  it("renders the 'Sign & Approve Escrow' button for eligible un-signed approvers", () => {
    mockUseSettlementSummary.mockReturnValue({
      data: {
        onChainStatus: "SUCCESS",
        confirmations: 12,
        payments: [
          {
            id: "pay-1",
            amount: 125,
            asset: "USDC",
            destination: "G_MOCK_USER_PUBLIC_KEY",
            status: "SUCCESS",
          },
        ],
        stellarExplorerUrl: "https://stellar.expert/explorer/testnet/tx/mock_tx_hash",
      },
      isLoading: false,
      isError: false,
      isForbidden: false,
      isNotFound: false,
      error: null,
    });

    mockUseEscrowStatus.mockReturnValue({
      data: {
        status: "FUNDED",
        signatures: [],
        required_approvals: 2,
        escrow_account_id: "G_ESCROW",
        balance: "100",
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn() as any,
    });

    renderWithQueryClient(<SettlementSummaryPage isAdmin />);
    expect(screen.getByText("Sign & Approve Escrow")).toBeTruthy();
    expect(screen.queryByText("Signature Submitted")).toBeNull();
  });

  it("renders the 'Signature Submitted' message for already signed approvers", () => {
    mockUseSettlementSummary.mockReturnValue({
      data: {
        onChainStatus: "SUCCESS",
        confirmations: 12,
        payments: [
          {
            id: "pay-1",
            amount: 125,
            asset: "USDC",
            destination: "G_MOCK_USER_PUBLIC_KEY",
            status: "SUCCESS",
          },
        ],
        stellarExplorerUrl: "https://stellar.expert/explorer/testnet/tx/mock_tx_hash",
      },
      isLoading: false,
      isError: false,
      isForbidden: false,
      isNotFound: false,
      error: null,
    });

    mockUseEscrowStatus.mockReturnValue({
      data: {
        status: "FUNDED",
        signatures: [{ id: "1", signer: "G_MOCK_USER_PUBLIC_KEY", timestamp: "now" }],
        required_approvals: 2,
        escrow_account_id: "G_ESCROW",
        balance: "100",
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn() as any,
    });

    renderWithQueryClient(<SettlementSummaryPage isAdmin />);
    expect(screen.queryByText("Sign & Approve Escrow")).toBeNull();
    expect(screen.getByText("Signature Submitted")).toBeTruthy();
  });
});

describe("EscrowFundedBanner", () => {
  it("renders and dismisses while persisting the sessionStorage flag", () => {
    render(
      <EscrowFundedBanner
        amount={125}
        currency="USDC"
        escrowId={fundedEscrow.escrowId}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss funded banner" }),
    );

    expect(screen.queryByTestId("escrow-funded-banner")).toBeNull();
    expect(
      sessionStorage.getItem(
        getEscrowFundedBannerStorageKey(fundedEscrow.escrowId),
      ),
    ).toBe("true");
  });
});

describe("AdoptionCompleteButton", () => {
  it("stays hidden for non-admin users", () => {
    render(<AdoptionCompleteButton isAdmin={false} onConfirm={vi.fn()} />);

    expect(screen.queryByText("Complete Adoption")).toBeNull();
  });

  it("supports the confirmation modal flow", () => {
    const onConfirm = vi.fn();
    render(<AdoptionCompleteButton isAdmin onConfirm={onConfirm} />);

    fireEvent.click(screen.getByText("Complete Adoption"));

    expect(screen.getByRole("dialog")).toBeTruthy();

    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByText("Complete Adoption"));
    fireEvent.click(screen.getByText("Confirm"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

