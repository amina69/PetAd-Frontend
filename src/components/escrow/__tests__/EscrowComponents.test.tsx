import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { AdoptionCompleteButton } from "../AdoptionCompleteButton";
import {
  EscrowFundedBanner,
  getEscrowFundedBannerStorageKey,
} from "../EscrowFundedBanner";
import { EscrowStatusCard } from "../EscrowStatusCard";
import { StellarTxLink } from "../StellarTxLink";
import type { EscrowStatusData, SettlementSummary } from "../types";
import { SettlementSummaryPage } from "../../../pages/SettlementSummaryPage";

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

    expect(
      screen.getByTestId("escrow-status-card-skeleton"),
    ).toBeTruthy();
  });

  it("renders funded escrow data", () => {
    renderWithQueryClient(
      <EscrowStatusCard escrowId={fundedEscrow.escrowId} initialData={fundedEscrow} />,
    );

    expect(screen.getByText("Milo")).toBeTruthy();
    expect(screen.getByText("Funded")).toBeTruthy();
    expect(screen.getByText("USDC 125.00 for adoption #AD-1001")).toBeTruthy();
  });

  it("renders settled state messaging", () => {
    renderWithQueryClient(
      <EscrowStatusCard escrowId={settledEscrow.escrowId} initialData={settledEscrow} />,
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
  it("renders the full summary with funded data", () => {
    const summary: SettlementSummary = {
      status: "FUNDED",
      headline: "Escrow funded for Milo",
      description: "Funds are secured and ready for the final adoption review.",
      escrow: fundedEscrow,
    };

    renderWithQueryClient(
      <SettlementSummaryPage
        isAdmin
        onComplete={vi.fn()}
        summary={summary}
      />,
    );

    expect(screen.getByText("Escrow funded for Milo")).toBeTruthy();
    expect(screen.getByTestId("escrow-funded-banner")).toBeTruthy();
    expect(screen.getByText("Complete Adoption")).toBeTruthy();
  });

  it("renders the failed settlement state", () => {
    const summary: SettlementSummary = {
      status: "SETTLEMENT_FAILED",
      headline: "Settlement failed",
      description: "The payout could not be completed and needs attention.",
      escrow: {
        ...fundedEscrow,
        status: "SETTLEMENT_FAILED",
        failureReason: "Destination wallet rejected the transfer.",
      },
    };

    renderWithQueryClient(<SettlementSummaryPage summary={summary} />);

    expect(screen.getByText("Settlement Failed")).toBeTruthy();
    expect(
      screen.getByText("Destination wallet rejected the transfer."),
    ).toBeTruthy();
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

    fireEvent.click(screen.getByRole("button", { name: "Dismiss funded banner" }));

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

describe("StellarTxLink", () => {
  it("renders the correct href, truncates the hash, and copies to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<StellarTxLink txHash={txHash} />);

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe(
      `https://stellar.expert/explorer/testnet/tx/${txHash}`,
    );
    expect(link.textContent).toBe("abcdef12...34567890");

    fireEvent.click(screen.getByText("Copy"));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(txHash));
  });
});
