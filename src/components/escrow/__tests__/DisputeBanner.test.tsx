
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import { DisputeBanner } from "../DisputeBanner";

vi.mock("../../ui/StellarTxLink", () => ({
  StellarTxLink: ({ id }: { id: string }) => (
    <span data-testid="stellar-tx-link">{id}</span>
  ),
}));

const DEFAULT_PROPS = {
  disputeId: "dispute-001",
  raisedAt: "2026-03-23T10:45:00.000Z",
  escrowAccountId: "GABC1234ESCROWXYZ",
};

function renderBanner(props = DEFAULT_PROPS) {
  return render(
    <MemoryRouter>
      <DisputeBanner {...props} />
    </MemoryRouter>,
  );
}

describe("DisputeBanner", () => {
  it("renders the main dispute message", () => {
    renderBanner();
    expect(
      screen.getByText("A dispute has been raised. Escrow settlement is paused."),
    ).toBeInTheDocument();
  });

  it("has role=alert for screen reader announcement", () => {
    renderBanner();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("displays the dispute ID", () => {
    renderBanner();
    expect(screen.getByTestId("dispute-id")).toHaveTextContent("dispute-001");
  });

  it("displays a formatted raised date containing the year", () => {
    renderBanner();
    expect(screen.getByTestId("dispute-raised-at").textContent).toContain("2026");
  });

  it("renders StellarTxLink with the escrowAccountId", () => {
    renderBanner();
    expect(screen.getByTestId("stellar-tx-link")).toHaveTextContent("GABC1234ESCROWXYZ");
  });

  it("renders a link to the dispute detail page", () => {
    renderBanner();
    const link = screen.getByTestId("dispute-detail-link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/disputes/dispute-001");
  });

  it("uses the correct dispute route for a different disputeId", () => {
    render(
      <MemoryRouter>
        <DisputeBanner
          disputeId="dispute-999"
          raisedAt="2026-01-01T00:00:00.000Z"
          escrowAccountId="GXYZ"
        />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("dispute-detail-link")).toHaveAttribute(
      "href",
      "/disputes/dispute-999",
    );
  });
});
