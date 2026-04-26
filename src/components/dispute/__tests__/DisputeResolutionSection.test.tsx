import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DisputeResolutionSection } from "../DisputeResolutionSection";
import type { DisputeResolution } from "../../../types/dispute";

// Mock the components used inside
vi.mock("../../escrow/SplitOutcomeChart", () => ({
  SplitOutcomeChart: vi.fn(() => <div data-testid="mock-chart">Split Chart</div>),
}));

vi.mock("../../ui/StellarTxLink", () => ({
  StellarTxLink: vi.fn(({ id }: { id: string }) => (
    <div data-testid="mock-stellar-link">Link: {id}</div>
  )),
}));

const MOCK_RESOLUTION: DisputeResolution = {
  type: "SPLIT",
  adminNote: "Funds split between parties due to partial health issues.",
  resolvedBy: "Admin Jane",
  resolvedAt: "2026-04-20T14:30:00Z",
  resolutionTxHash: "0xabcdef1234567890",
  splitData: [
    { recipient: "Shelter", amount: "50", percentage: 50 },
    { recipient: "Adopter", amount: "50", percentage: 50 },
  ],
};

describe("DisputeResolutionSection", () => {
  it("renders nothing when status is not resolved", () => {
    const { container } = render(
      <DisputeResolutionSection status="open" resolution={MOCK_RESOLUTION} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when resolution data is missing", () => {
    const { container } = render(
      <DisputeResolutionSection status="resolved" resolution={undefined} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders resolution details when status is resolved", () => {
    render(<DisputeResolutionSection status="resolved" resolution={MOCK_RESOLUTION} />);
    
    expect(screen.getByText("Dispute Resolution")).toBeTruthy();
    expect(screen.getByText("SPLIT")).toBeTruthy();
    expect(screen.getByText(new RegExp(MOCK_RESOLUTION.adminNote))).toBeTruthy();
    expect(screen.getByText(MOCK_RESOLUTION.resolvedBy)).toBeTruthy();
  });

  it("renders SplitOutcomeChart when resolution type is SPLIT", () => {
    render(<DisputeResolutionSection status="resolved" resolution={MOCK_RESOLUTION} />);
    
    expect(screen.getByTestId("mock-chart")).toBeTruthy();
  });

  it("does not render SplitOutcomeChart when resolution type is REFUND", () => {
    const refundResolution: DisputeResolution = {
      ...MOCK_RESOLUTION,
      type: "REFUND",
    };
    render(<DisputeResolutionSection status="resolved" resolution={refundResolution} />);
    
    expect(screen.queryByTestId("mock-chart")).toBeNull();
  });

  it("renders StellarTxLink when resolutionTxHash is provided", () => {
    render(<DisputeResolutionSection status="resolved" resolution={MOCK_RESOLUTION} />);
    
    expect(screen.getByTestId("mock-stellar-link")).toBeTruthy();
    expect(screen.getByText(new RegExp(MOCK_RESOLUTION.resolutionTxHash!))).toBeTruthy();
  });
});
