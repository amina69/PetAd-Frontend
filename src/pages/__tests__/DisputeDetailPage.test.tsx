import type { } from 'vitest'
/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import DisputeDetailPage from "../DisputeDetailPage";
import { vi, describe, it, expect } from "vitest";
// Alternatively, we just use the real components and check the DOM output.
// We'll use the real ones here since it tests the integration.

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ disputeId: "test-dispute-id" }),
  };
});

describe("DisputeDetailPage", () => {
  const renderWithRouter = (component: React.ReactNode) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it("renders the dispute detail timeline with events", () => {
    renderWithRouter(<DisputeDetailPage />);

    // Since our mock hook returns default data with 3 events
    expect(screen.getByText(/Dispute Detail/i)).toBeInTheDocument();
    
    // Check if the badges render
    // DISPUTE_RAISED uses sdkPauseConfirmed
    expect(screen.getByTestId("escrow-paused-badge")).toBeInTheDocument();
    expect(screen.getByText("Escrow Paused")).toBeInTheDocument();

    // DISPUTE_RESOLVED uses StellarTxLink
    // The StellarTxLink component should render a link with the txHash
    const stellarLink = screen.getByRole("link", { name: /View transaction on Stellar explorer/i });
    expect(stellarLink).toBeInTheDocument();
    expect(stellarLink).toHaveAttribute("href", expect.stringContaining("4b97148c34f37df26a9ece0cf7a30c501fbb8918fd3fdeb0a02cbdb8ff3fae32"));
  });

  it("renders timeline entries in the correct order", () => {
    renderWithRouter(<DisputeDetailPage />);
    
    // Get all timeline entries
    const entries = screen.getAllByTestId(/timeline-entry/);
    expect(entries).toHaveLength(3);
    
    // First entry should be RESOLVED (latest)
    expect(entries[0]).toHaveTextContent("resolv"); // Matches resolving or resolved status / reason
    
    // Second should be ESCALATED
    expect(entries[1]).toHaveTextContent("escalat");
    
    // Third should be RAISED
    expect(entries[2]).toHaveTextContent("raise");
  });
});
