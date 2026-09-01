import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DisputeInfoSection } from "../DisputeInfoSection";
import type { DisputeDetail } from "../../../pages/disputes/types";

// Mock child components to isolate the unit under test
vi.mock("../EvidenceList", () => ({
  EvidenceList: ({ evidence }: { evidence: any[] }) => (
    <div data-testid="evidence-list">
      {evidence.map((e) => (
        <span key={e.id} data-testid={`evidence-${e.id}`}>
          {e.fileName}
        </span>
      ))}
    </div>
  ),
}));

vi.mock("../AddEvidenceButton", () => ({
  AddEvidenceButton: ({ onClick }: { onClick: () => void }) => (
    <button data-testid="add-evidence-button" onClick={onClick}>
      + Add Evidence
    </button>
  ),
}));

vi.mock("../../modals/EvidenceUploadModal", () => ({
  EvidenceUploadModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="evidence-upload-modal">Modal Open</div> : null,
}));

vi.mock("../../badges/DisputeStatusBadge", () => ({
  DisputeStatusBadge: ({ status }: { status: string }) => (
    <span data-testid="dispute-status-badge">{status}</span>
  ),
}));

vi.mock("../../badges/DisputeSLABadge", () => ({
  DisputeSLABadge: ({ slaStatus }: { slaStatus: string }) => (
    <span data-testid="dispute-sla-badge">{slaStatus}</span>
  ),
}));

vi.mock("../../badges/EscrowStatusBadge", () => ({
  EscrowStatusBadge: ({ status }: { status: string }) => (
    <span data-testid="escrow-status-badge">{status}</span>
  ),
}));

vi.mock("../../blockchain/StellarTxLink", () => ({
  StellarTxLink: ({ accountId }: { accountId: string }) => (
    <span data-testid="stellar-tx-link">{accountId}</span>
  ),
}));

const baseDispute: DisputeDetail = {
  id: "DSP-001",
  raisedBy: { name: "Alice Smith", role: "ADOPTER" },
  reason: "Pet health condition mismatch",
  status: "OPEN",
  slaStatus: "ON_TIME",
  escrow: { status: "LOCKED", accountId: "GABC123" },
  evidence: [
    { id: "ev-1", fileName: "report.pdf", url: "/mock/report.pdf", sha256: "abc123" },
  ],
  resolution: null,
};

describe("DisputeInfoSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders raised by name and role", () => {
    render(<DisputeInfoSection dispute={baseDispute} />);
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("ADOPTER")).toBeInTheDocument();
  });

  it("renders the reason", () => {
    render(<DisputeInfoSection dispute={baseDispute} />);
    expect(screen.getByText("Pet health condition mismatch")).toBeInTheDocument();
  });

  it("renders dispute status badge", () => {
    render(<DisputeInfoSection dispute={baseDispute} />);
    expect(screen.getByTestId("dispute-status-badge")).toHaveTextContent("OPEN");
  });

  it("renders SLA status badge", () => {
    render(<DisputeInfoSection dispute={baseDispute} />);
    expect(screen.getByTestId("dispute-sla-badge")).toHaveTextContent("ON_TIME");
  });

  it("renders escrow status badge", () => {
    render(<DisputeInfoSection dispute={baseDispute} />);
    expect(screen.getByTestId("escrow-status-badge")).toHaveTextContent("LOCKED");
  });

  it("renders Stellar account link", () => {
    render(<DisputeInfoSection dispute={baseDispute} />);
    expect(screen.getByTestId("stellar-tx-link")).toHaveTextContent("GABC123");
  });

  it("renders evidence list with items", () => {
    render(<DisputeInfoSection dispute={baseDispute} />);
    expect(screen.getByTestId("evidence-list")).toBeInTheDocument();
    expect(screen.getByTestId("evidence-ev-1")).toHaveTextContent("report.pdf");
  });

  it("shows Add Evidence button when status is OPEN", () => {
    render(<DisputeInfoSection dispute={baseDispute} />);
    expect(screen.getByTestId("add-evidence-button")).toBeInTheDocument();
  });

  it("shows Add Evidence button when status is UNDER_REVIEW", () => {
    render(
      <DisputeInfoSection dispute={{ ...baseDispute, status: "UNDER_REVIEW" }} />,
    );
    expect(screen.getByTestId("add-evidence-button")).toBeInTheDocument();
  });

  it("hides Add Evidence button when status is RESOLVED", () => {
    render(
      <DisputeInfoSection dispute={{ ...baseDispute, status: "RESOLVED" }} />,
    );
    expect(screen.queryByTestId("add-evidence-button")).not.toBeInTheDocument();
  });

  it("hides Add Evidence button when status is REJECTED", () => {
    render(
      <DisputeInfoSection dispute={{ ...baseDispute, status: "REJECTED" }} />,
    );
    expect(screen.queryByTestId("add-evidence-button")).not.toBeInTheDocument();
  });

  it("opens evidence upload modal when Add Evidence is clicked", () => {
    render(<DisputeInfoSection dispute={baseDispute} />);
    expect(screen.queryByTestId("evidence-upload-modal")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("add-evidence-button"));
    expect(screen.getByTestId("evidence-upload-modal")).toBeInTheDocument();
  });

  it("renders section headings", () => {
    render(<DisputeInfoSection dispute={baseDispute} />);
    expect(screen.getByText("Raised By")).toBeInTheDocument();
    expect(screen.getByText("Reason")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Escrow Status")).toBeInTheDocument();
    expect(screen.getByText("Evidence Files")).toBeInTheDocument();
  });

  it("renders empty evidence list when no evidence", () => {
    render(
      <DisputeInfoSection dispute={{ ...baseDispute, evidence: [] }} />,
    );
    expect(screen.getByTestId("evidence-list")).toBeInTheDocument();
    expect(screen.queryByTestId("evidence-ev-1")).not.toBeInTheDocument();
  });
});
