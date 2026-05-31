import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ApprovalStatusWidget } from "../ApprovalStatusWidget";

describe("ApprovalStatusWidget", () => {
  it("renders progress bar and quorum met message correctly", () => {
    const { rerender } = render(<ApprovalStatusWidget received={2} required={3} />);
    
    // Progress bar width
    expect(screen.getByTestId("progress-bar").style.width).toBe("67%");
    
    // Quorum not met message
    expect(screen.getByText(/Waiting for 1 more approval/i)).toBeInTheDocument();
    
    // Quorum met
    rerender(<ApprovalStatusWidget received={3} required={3} />);
    expect(screen.getByTestId("progress-bar").style.width).toBe("100%");
    expect(screen.getByText(/All approvals received/i)).toBeInTheDocument();
  });

  it("renders StellarTxLink when transaction exists", () => {
    render(<ApprovalStatusWidget received={3} required={3} escrowAccountId="G12345" />);
    const link = screen.getByTestId("stellar-tx-link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", expect.stringContaining("G12345"));
  });

  it("renders rows for pending, approved, rejected statuses", () => {
    const mockApprovals = [
      { id: '1', approverName: 'Alice', status: 'pending' as const },
      { id: '2', approverName: 'Bob', status: 'approved' as const },
      { id: '3', approverName: 'Charlie', status: 'rejected' as const }
    ];
    
    render(<ApprovalStatusWidget received={1} required={3} approvals={mockApprovals} />);
    
    // Check rows rendering
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge-pending-1')).toBeInTheDocument();
    
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge-approved-2')).toBeInTheDocument();
    
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge-rejected-3')).toBeInTheDocument();
  });
});


  // Issues Implemented

  