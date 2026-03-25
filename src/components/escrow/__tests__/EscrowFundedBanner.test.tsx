import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EscrowFundedBanner, getEscrowFundedBannerStorageKey } from "../EscrowFundedBanner";

describe("EscrowFundedBanner", () => {
  const props = {
    adoptionId: "adoption-123",
    petName: "Max",
    amount: 100,
    currency: "USDC",
    txHash: "tx-hash-456",
  };

  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("renders with pet name and amount", () => {
    render(<EscrowFundedBanner {...props} />);
    
    expect(screen.getByText(/Max's adoption fee of USDC 100.00 is secured/i)).toBeDefined();
    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByTestId("stellar-tx-link")).toBeDefined();
  });

  it("hides banner and sets sessionStorage when dismissed", () => {
    render(<EscrowFundedBanner {...props} />);
    
    const dismissButton = screen.getByRole("button", { name: /dismiss/i });
    fireEvent.click(dismissButton);

    expect(screen.queryByTestId("escrow-funded-banner")).toBeNull();
    expect(sessionStorage.getItem(getEscrowFundedBannerStorageKey(props.adoptionId))).toBe("true");
  });

  it("does not render if already dismissed in sessionStorage", () => {
    sessionStorage.setItem(getEscrowFundedBannerStorageKey(props.adoptionId), "true");
    render(<EscrowFundedBanner {...props} />);
    
    expect(screen.queryByTestId("escrow-funded-banner")).toBeNull();
  });

  it("re-renders when adoptionId changes even if previous was dismissed", () => {
    const { rerender } = render(<EscrowFundedBanner {...props} />);
    
    // Dismiss first
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(screen.queryByTestId("escrow-funded-banner")).toBeNull();

    // Change adoptionId
    const newProps = { ...props, adoptionId: "adoption-789", petName: "Bella" };
    rerender(<EscrowFundedBanner {...newProps} />);
    
    expect(screen.getByTestId("escrow-funded-banner")).toBeDefined();
    expect(screen.getByText(/Bella's adoption fee/i)).toBeDefined();
  });

  it("has correct accessibility attributes", () => {
    render(<EscrowFundedBanner {...props} />);
    
    const banner = screen.getByTestId("escrow-funded-banner");
    expect(banner.getAttribute("role")).toBe("alert");
    expect(banner.getAttribute("aria-live")).toBe("polite");
  });
});
