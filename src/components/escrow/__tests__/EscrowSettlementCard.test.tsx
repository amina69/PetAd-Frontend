import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { EscrowSettlementCard } from "../EscrowSettlementCard";
import { useEscrowStatus } from "../../../lib/hooks/useEscrowStatus";

// Mock the hook
vi.mock("../../../lib/hooks/useEscrowStatus", () => ({
  useEscrowStatus: vi.fn(),
}));

const mockUseEscrowStatus = vi.mocked(useEscrowStatus);

describe("EscrowSettlementCard", () => {
  it("matches snapshot in loading state", () => {
    mockUseEscrowStatus.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });

    const { asFragment } = render(<EscrowSettlementCard escrowId="test-escrow" />);
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches snapshot in funded state", () => {
    mockUseEscrowStatus.mockReturnValue({
      data: {
        status: "FUNDED",
        balance: "100.50",
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    vi.setSystemTime(new Date("2026-03-25T22:20:00Z"));

    const { asFragment } = render(<EscrowSettlementCard escrowId="test-escrow" />);
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches snapshot in settled state", () => {
    mockUseEscrowStatus.mockReturnValue({
      data: {
        status: "SETTLED",
        balance: "0.00",
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    vi.setSystemTime(new Date("2026-03-25T22:20:00Z"));

    const { asFragment } = render(<EscrowSettlementCard escrowId="test-escrow" />);
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches snapshot in error state", () => {
    mockUseEscrowStatus.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });

    const { asFragment } = render(<EscrowSettlementCard escrowId="test-escrow" />);
    expect(asFragment()).toMatchSnapshot();
  });
});