import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EscrowFundedBanner } from "../EscrowFundedBanner";

// ── Mock StellarTxLink so tests are isolated from its internals ───────────────
vi.mock("../../ui/StellarTxLink", () => ({
  StellarTxLink: ({ id }: { id: string }) => (
    <a href={`https://stellar.expert/explorer/public/tx/${id}`} data-testid="stellar-tx-link">
      {id}
    </a>
  ),
}));

// ── Shared test data ──────────────────────────────────────────────────────────
const DEFAULT_PROPS = {
  adoptionId: "adoption-42",
  petName: "Luna",
  amount: 250,
  currency: "USDC",
  txHash: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
};

function renderBanner(props = DEFAULT_PROPS) {
  return render(<EscrowFundedBanner {...props} />);
}

// ── Test suite ────────────────────────────────────────────────────────────────
describe("EscrowFundedBanner", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  // 1. Banner renders with correct petName, amount, and txHash passed to StellarTxLink
  it("renders with correct petName, amount, and StellarTxLink txHash", () => {
    renderBanner();

    // petName visible in the message
    expect(screen.getByText(/Luna/)).toBeInTheDocument();
    // formatted amount visible
    expect(screen.getByText(/USDC 250\.00/)).toBeInTheDocument();
    // StellarTxLink received the txHash
    expect(screen.getByTestId("stellar-tx-link")).toHaveAttribute(
      "href",
      `https://stellar.expert/explorer/public/tx/${DEFAULT_PROPS.txHash}`,
    );
  });

  // 2. Clicking dismiss hides the banner
  it("hides the banner after clicking dismiss", () => {
    renderBanner();

    expect(screen.getByTestId("escrow-funded-banner")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss funded banner" }));

    expect(screen.queryByTestId("escrow-funded-banner")).toBeNull();
  });

  // 3. Clicking dismiss sets the correct sessionStorage key for the adoptionId
  it("sets the correct sessionStorage key on dismiss", () => {
    renderBanner();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss funded banner" }));

    expect(
      sessionStorage.getItem(`escrow-banner-dismissed-${DEFAULT_PROPS.adoptionId}`),
    ).toBe("true");
  });

  // 4. Re-rendering with a new adoptionId shows the banner even if a different adoptionId was dismissed
  it("shows the banner for a new adoptionId even when the previous one was dismissed", () => {
    // Dismiss for the first adoptionId
    sessionStorage.setItem(`escrow-banner-dismissed-adoption-42`, "true");

    // Render with a fresh adoptionId — banner must appear
    render(
      <EscrowFundedBanner
        {...DEFAULT_PROPS}
        adoptionId="adoption-99"
      />,
    );

    expect(screen.getByTestId("escrow-funded-banner")).toBeInTheDocument();
  });

  // 5. Banner does not render if sessionStorage already has the dismissal key
  it("does not render when sessionStorage already has the dismissal key for the current adoptionId", () => {
    sessionStorage.setItem(
      `escrow-banner-dismissed-${DEFAULT_PROPS.adoptionId}`,
      "true",
    );

    renderBanner();

    expect(screen.queryByTestId("escrow-funded-banner")).toBeNull();
  });

  // Accessibility: role and aria-live attributes are present
  it("has role=alert and aria-live=polite on the root element", () => {
    renderBanner();

    const banner = screen.getByTestId("escrow-funded-banner");
    expect(banner).toHaveAttribute("role", "alert");
    expect(banner).toHaveAttribute("aria-live", "polite");
  });
});
