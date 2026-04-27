import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { EscrowFundedBanner } from "../EscrowFundedBanner";
import { getEscrowFundedBannerStorageKey } from "../types";

// Mock StellarTxLink to avoid external dependencies in unit tests
vi.mock("../../ui/StellarTxLink", () => ({
  StellarTxLink: ({ id }: { id: string }) => <span data-testid="stellar-link">{id}</span>,
}));

describe("EscrowFundedBanner", () => {
  const defaultProps = {
    adoptionId: "adoption-123",
    petName: "Milo",
    amount: 150,
    currency: "USDC",
    txHash: "tx-abc-123",
  };

  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
  });

  it("renders with correct pet name and amount", () => {
    render(<EscrowFundedBanner {...defaultProps} />);
    
    // Fast-forward animation timers
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByText(/Milo/i)).toBeTruthy();
    expect(screen.getByText(/USDC 150.00/i)).toBeTruthy();
    expect(screen.getByTestId("stellar-link")).toBeTruthy();
    expect(screen.getByText("tx-abc-123")).toBeTruthy();
  });

  it("has correct accessibility attributes", () => {
    render(<EscrowFundedBanner {...defaultProps} />);
    
    const banner = screen.getByTestId("escrow-funded-banner");
    expect(banner.getAttribute("role")).toBe("alert");
    expect(banner.getAttribute("aria-live")).toBe("polite");
  });

  it("dismisses the banner and sets sessionStorage", () => {
    const { rerender } = render(<EscrowFundedBanner {...defaultProps} />);
    
    const dismissButton = screen.getByRole("button", { name: /dismiss funded banner/i });
    fireEvent.click(dismissButton);

    // Fast-forward dismissal animation timers
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.queryByTestId("escrow-funded-banner")).toBeNull();
    
    const storageKey = getEscrowFundedBannerStorageKey(defaultProps.adoptionId);
    expect(sessionStorage.getItem(storageKey)).toBe("true");

    // Verify it stays hidden on re-render
    rerender(<EscrowFundedBanner {...defaultProps} />);
    expect(screen.queryByTestId("escrow-funded-banner")).toBeNull();
  });

  it("re-appears on new adoptionId", async () => {
    const { rerender } = render(<EscrowFundedBanner {...defaultProps} />);
    
    // Dismiss for adoption-123
    fireEvent.click(screen.getByRole("button", { name: /dismiss funded banner/i }));
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(screen.queryByTestId("escrow-funded-banner")).toBeNull();

    // Re-render with new adoptionId
    rerender(<EscrowFundedBanner {...defaultProps} adoptionId="adoption-456" />);
    
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByTestId("escrow-funded-banner")).toBeInTheDocument();
  });

  it("starts with hidden state and animates in", () => {
    render(<EscrowFundedBanner {...defaultProps} />);
    
    const banner = screen.getByTestId("escrow-funded-banner");
    // Initial state should have opacity-0 and -translate-y-4
    expect(banner).toHaveClass("opacity-0");
    expect(banner).toHaveClass("-translate-y-4");

    // Animate in
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(banner).toHaveClass("opacity-100");
    expect(banner).toHaveClass("translate-y-0");
  });
});
