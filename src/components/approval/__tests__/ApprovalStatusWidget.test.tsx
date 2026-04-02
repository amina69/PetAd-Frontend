import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ApprovalStatusWidget } from "../ApprovalStatusWidget";

describe("ApprovalStatusWidget", () => {
  it("Verify the progress bar width correctly reflects the percentage (e.g., 2 of 4 is 50%)", () => {
    render(<ApprovalStatusWidget received={2} required={4} />);

    const progressBar = screen.getByTestId("progress-bar");
    expect(progressBar.style.width).toBe("50%");
  });

  it("Ensure the success message ONLY appears when quorum is met", () => {
    const { rerender } = render(<ApprovalStatusWidget received={1} required={3} />);

    // Quorum not met
    expect(screen.queryByText(/All approvals received/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Waiting for 2 more approvals/i)).toBeInTheDocument();

    // Quorum met
    rerender(<ApprovalStatusWidget received={3} required={3} />);
    expect(screen.getByText(/All approvals received/i)).toBeInTheDocument();
    expect(screen.queryByText(/Waiting for/i)).not.toBeInTheDocument();
  });

  it("Ensure the Stellar link renders correctly and contains the escrowAccountId when provided", () => {
    const testAccountId = "GBX2X...MOCK";
    render(<ApprovalStatusWidget received={3} required={3} escrowAccountId={testAccountId} />);

    const link = screen.getByTestId("stellar-tx-link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", expect.stringContaining(testAccountId));
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("Verify the progress bar caps at 100% even if received > required", () => {
    render(<ApprovalStatusWidget received={5} required={4} />);

    const progressBar = screen.getByTestId("progress-bar");
    expect(progressBar.style.width).toBe("100%");
  });
});
