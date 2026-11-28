import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ApprovalDetailModal } from "../ApprovalDetailModal";
import type { ApprovalRowData } from "../../approval/ApprovalStatusWidget";

const APPROVALS: ApprovalRowData[] = [
  { id: "1", approverName: "Alice", status: "approved" },
  { id: "2", approverName: "Bob", status: "rejected" },
  { id: "3", approverName: "Carol", status: "pending" },
];

describe("ApprovalDetailModal", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <ApprovalDetailModal
        isOpen={false}
        onClose={vi.fn()}
        title="Approval Details"
        received={1}
        required={3}
        approvals={APPROVALS}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders dialog when isOpen is true", () => {
    render(
      <ApprovalDetailModal
        isOpen={true}
        onClose={vi.fn()}
        title="Approval Details"
        received={1}
        required={3}
        approvals={APPROVALS}
      />,
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("has role='dialog' and aria-modal='true'", () => {
    render(
      <ApprovalDetailModal
        isOpen={true}
        onClose={vi.fn()}
        title="Approval Details"
        received={1}
        required={3}
        approvals={APPROVALS}
      />,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
  });

  it("displays the title", () => {
    render(
      <ApprovalDetailModal
        isOpen={true}
        onClose={vi.fn()}
        title="Multi-sig Approval"
        received={2}
        required={3}
        approvals={[]}
      />,
    );
    expect(screen.getByText("Multi-sig Approval")).toBeTruthy();
  });

  it("renders progress bar with correct aria attributes", () => {
    render(
      <ApprovalDetailModal
        isOpen={true}
        onClose={vi.fn()}
        title="Approval"
        received={2}
        required={4}
        approvals={[]}
      />,
    );
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("2");
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("4");
  });

  it("shows quorum met message when received >= required", () => {
    render(
      <ApprovalDetailModal
        isOpen={true}
        onClose={vi.fn()}
        title="Approval"
        received={3}
        required={3}
        approvals={[]}
      />,
    );
    expect(screen.getByText(/quorum met/i)).toBeTruthy();
  });

  it("shows remaining approvals count when quorum not met", () => {
    render(
      <ApprovalDetailModal
        isOpen={true}
        onClose={vi.fn()}
        title="Approval"
        received={1}
        required={3}
        approvals={[]}
      />,
    );
    expect(screen.getByText(/2 more approval/i)).toBeTruthy();
  });

  it("renders all approver rows", () => {
    render(
      <ApprovalDetailModal
        isOpen={true}
        onClose={vi.fn()}
        title="Approval"
        received={1}
        required={3}
        approvals={APPROVALS}
      />,
    );
    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();
    expect(screen.getByText("Carol")).toBeTruthy();
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <ApprovalDetailModal
        isOpen={true}
        onClose={onClose}
        title="Approval"
        received={1}
        required={3}
        approvals={APPROVALS}
      />,
    );
    fireEvent.click(screen.getByLabelText("Close approval detail"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the footer Close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <ApprovalDetailModal
        isOpen={true}
        onClose={onClose}
        title="Approval"
        received={1}
        required={3}
        approvals={[]}
      />,
    );
    fireEvent.click(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the backdrop is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(
      <ApprovalDetailModal
        isOpen={true}
        onClose={onClose}
        title="Approval"
        received={1}
        required={3}
        approvals={[]}
      />,
    );
    // Backdrop is the first div inside the dialog
    const backdrop = container.querySelector("[aria-hidden='true']") as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
