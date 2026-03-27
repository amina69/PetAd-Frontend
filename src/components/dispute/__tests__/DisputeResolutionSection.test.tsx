import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DisputeResolutionSection } from "../DisputeResolutionSection";
import type { Dispute } from "../../../types/dispute";

describe("DisputeResolutionSection", () => {
  it("is hidden when dispute status is OPEN", () => {
    const dispute: Dispute = {
      id: "dispute-001",
      adoptionId: "adoption-001",
      raisedBy: "user-1",
      reason: "test",
      description: "test",
      status: "OPEN",
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-03-01T00:00:00.000Z",
    };

    const { container } = render(<DisputeResolutionSection dispute={dispute} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders resolution details when status is RESOLVED", () => {
    const dispute: Dispute = {
      id: "dispute-001",
      adoptionId: "adoption-001",
      raisedBy: "user-1",
      reason: "test",
      description: "test",
      status: "RESOLVED",
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-03-01T00:00:00.000Z",
      resolution: {
        type: "REFUND",
        adminNote: "Refund approved",
        resolvedBy: "admin@example.com",
        resolvedAt: "2026-03-25T14:30:00.000Z",
        resolutionTxHash: "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
      },
    };

    render(<DisputeResolutionSection dispute={dispute} />);

    expect(screen.getByText("Resolution")).toBeInTheDocument();
    expect(screen.getByText("REFUND")).toBeInTheDocument();
    expect(screen.getByText("Refund approved")).toBeInTheDocument();
    expect(screen.getByText("admin@example.com")).toBeInTheDocument();
    expect(screen.getByTestId("stellar-tx-link")).toBeInTheDocument();
  });

  it("renders SplitOutcomeChart when resolution type is SPLIT", () => {
    const dispute: Dispute = {
      id: "dispute-001",
      adoptionId: "adoption-001",
      raisedBy: "user-1",
      reason: "test",
      description: "test",
      status: "RESOLVED",
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-03-01T00:00:00.000Z",
      resolution: {
        type: "SPLIT",
        adminNote: "Split resolution",
        resolvedBy: "admin@example.com",
        resolvedAt: "2026-03-25T14:30:00.000Z",
        resolutionTxHash: "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
        distribution: [
          { recipient: "Shelter", amount: "50.00", percentage: 50 },
          { recipient: "Adopter", amount: "50.00", percentage: 50 },
        ],
      },
    };

    render(<DisputeResolutionSection dispute={dispute} />);

    expect(screen.getByText("SPLIT")).toBeInTheDocument();
    expect(screen.getByTestId("split-outcome-chart")).toBeInTheDocument();
    expect(screen.getByTestId("stellar-tx-link")).toBeInTheDocument();
  });
});