import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ApproverRow } from "../ApproverRow";
import type { EscrowSignature } from "../../../lib/hooks/useEscrowStatus";

describe("ApproverRow", () => {
  const mockApprover = {
    publicKey: "GABC1234567890XYZ",
    name: "Dr. Veterinarian",
  };

  const mockSignatures: EscrowSignature[] = [
    {
      id: "sig-1",
      signer: "GABC1234567890XYZ",
      timestamp: "2026-03-30T10:00:00Z",
    },
  ];

  it("renders the 'Signed' state when a matching signature is passed in", () => {
    render(
      <ApproverRow
        approver={mockApprover}
        signatures={mockSignatures}
      />
    );

    // Should display the name
    expect(screen.getByText("Dr. Veterinarian")).toBeInTheDocument();

    // Should display the Signed badge
    const signedBadge = screen.getByTestId("status-signed");
    expect(signedBadge).toBeInTheDocument();
    expect(signedBadge).toHaveTextContent("Signed");

    // Pending should NOT be displayed
    expect(screen.queryByTestId("status-pending")).not.toBeInTheDocument();
  });

  it("renders the 'Pending' state when no matching signature exists", () => {
    render(
      <ApproverRow
        approver={mockApprover}
        signatures={[]} // empty signatures
      />
    );

    // Should display the Pending badge
    const pendingBadge = screen.getByTestId("status-pending");
    expect(pendingBadge).toBeInTheDocument();
    expect(pendingBadge).toHaveTextContent("Pending");

    // Signed should NOT be displayed
    expect(screen.queryByTestId("status-signed")).not.toBeInTheDocument();
  });

  it("adds a 'You' indicator if the approver's public key matches currentUserPublicKey", () => {
    render(
      <ApproverRow
        approver={mockApprover}
        signatures={[]}
        currentUserPublicKey="GABC1234567890XYZ" // matches mockApprover.publicKey
      />
    );

    const youIndicator = screen.getByTestId("you-indicator");
    expect(youIndicator).toBeInTheDocument();
    expect(youIndicator).toHaveTextContent("You");
  });

  it("does not show 'You' indicator when keys do not match", () => {
    render(
      <ApproverRow
        approver={mockApprover}
        signatures={[]}
        currentUserPublicKey="G_OTHER_USER"
      />
    );

    expect(screen.queryByTestId("you-indicator")).not.toBeInTheDocument();
  });

  it("contains the StellarTxLink for the approver", () => {
    render(
      <ApproverRow
        approver={mockApprover}
        signatures={mockSignatures}
      />
    );

    const stellarLink = screen.getByTestId("stellar-tx-link");
    expect(stellarLink).toBeInTheDocument();
    expect(stellarLink).toHaveAttribute(
      "href",
      "https://stellar.expert/explorer/public/account/GABC1234567890XYZ"
    );
  });
});
