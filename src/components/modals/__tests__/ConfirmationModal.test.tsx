import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmationModal } from "../ConfirmationModal";

const mockOnConfirm = vi.fn();
const mockOnCancel = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

const defaultProps = {
  isOpen: true,
  title: "Delete Pet",
  body: "Are you sure you want to delete this pet? This action cannot be undone.",
  onConfirm: mockOnConfirm,
  onCancel: mockOnCancel,
};

describe("ConfirmationModal", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <ConfirmationModal {...defaultProps} isOpen={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders title and body when open", () => {
    render(<ConfirmationModal {...defaultProps} />);
    expect(screen.getByText("Delete Pet")).toBeTruthy();
    expect(
      screen.getByText(
        "Are you sure you want to delete this pet? This action cannot be undone.",
      ),
    ).toBeTruthy();
  });

  it("calls onConfirm when confirm button is clicked", () => {
    render(<ConfirmationModal {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when cancel button is clicked", () => {
    render(<ConfirmationModal {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when ESC key is pressed", () => {
    render(<ConfirmationModal {...defaultProps} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("does not call onCancel on ESC when modal is closed", () => {
    render(<ConfirmationModal {...defaultProps} isOpen={false} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it("focuses the confirm button when modal opens", () => {
    render(<ConfirmationModal {...defaultProps} />);
    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    expect(document.activeElement).toBe(confirmButton);
  });

  it("has role alertdialog", () => {
    render(<ConfirmationModal {...defaultProps} />);
    expect(screen.getByRole("alertdialog")).toBeTruthy();
  });

  it("has aria-modal set to true", () => {
    render(<ConfirmationModal {...defaultProps} />);
    const dialog = screen.getByRole("alertdialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
  });

  it("has aria-labelledby pointing to the title element", () => {
    render(<ConfirmationModal {...defaultProps} />);
    const dialog = screen.getByRole("alertdialog");
    const labelledById = dialog.getAttribute("aria-labelledby");
    expect(labelledById).toBeTruthy();
    const titleEl = document.getElementById(labelledById!);
    expect(titleEl?.textContent).toBe("Delete Pet");
  });

  it("confirm button has red styling when isDangerous is true", () => {
    render(<ConfirmationModal {...defaultProps} isDangerous={true} />);
    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    expect(confirmButton.className).toContain("bg-red-600");
  });

  it("confirm button does not have red styling when isDangerous is false", () => {
    render(<ConfirmationModal {...defaultProps} isDangerous={false} />);
    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    expect(confirmButton.className).not.toContain("bg-red-600");
  });

  it("renders custom confirmLabel and cancelLabel", () => {
    render(
      <ConfirmationModal
        {...defaultProps}
        confirmLabel="Yes, delete"
        cancelLabel="Keep it"
      />,
    );
    expect(
      screen.getByRole("button", { name: /yes, delete/i }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: /keep it/i })).toBeTruthy();
  });

  it("focus trap: Tab from last focusable element wraps to first", () => {
    render(<ConfirmationModal {...defaultProps} />);
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    const confirmButton = screen.getByRole("button", { name: /confirm/i });

    
    confirmButton.focus();
    expect(document.activeElement).toBe(confirmButton);

    fireEvent.keyDown(document, { key: "Tab", shiftKey: false });
    expect(document.activeElement).toBe(cancelButton);
  });

  it("focus trap: Shift+Tab from first focusable element wraps to last", () => {
    render(<ConfirmationModal {...defaultProps} />);
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    const confirmButton = screen.getByRole("button", { name: /confirm/i });

    // cancel is the first focusable element
    cancelButton.focus();
    expect(document.activeElement).toBe(cancelButton);

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(confirmButton);
  });
});