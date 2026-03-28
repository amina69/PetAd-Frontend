import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RejectionReasonModal } from "../RejectionReasonModal";

const mockOnSubmit = vi.fn();
const mockOnClose = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  onSubmit: mockOnSubmit,
};

describe("RejectionReasonModal", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <RejectionReasonModal {...defaultProps} isOpen={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders modal with correct title and description", () => {
    render(<RejectionReasonModal {...defaultProps} />);
    expect(screen.getByText("Rejection Reason")).toBeTruthy();
    expect(
      screen.getByText(
        "Please provide a reason for rejecting this adoption request",
      ),
    ).toBeTruthy();
  });

  it("renders all predefined reason chips", () => {
    render(<RejectionReasonModal {...defaultProps} />);
    expect(screen.getByText("Incomplete documents")).toBeTruthy();
    expect(screen.getByText("Pet not suitable")).toBeTruthy();
    expect(screen.getByText("Adopter profile concern")).toBeTruthy();
    expect(screen.getByText("Other")).toBeTruthy();
  });

  it("chip selection pre-fills textarea", () => {
    render(<RejectionReasonModal {...defaultProps} />);
    const chip = screen.getByText("Incomplete documents");
    fireEvent.click(chip);
    const textarea = screen.getByRole("textbox");
    expect((textarea as HTMLTextAreaElement).value).toBe(
      "Incomplete documents",
    );
  });

  it("user can edit pre-filled textarea", () => {
    render(<RejectionReasonModal {...defaultProps} />);
    const chip = screen.getByText("Incomplete documents");
    fireEvent.click(chip);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, {
      target: { value: "Incomplete documents - missing ID" },
    });
    expect((textarea as HTMLTextAreaElement).value).toBe(
      "Incomplete documents - missing ID",
    );
  });

  it("shows character counter with remaining characters", () => {
    render(<RejectionReasonModal {...defaultProps} />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Short" } });
    expect(screen.getByText("15 characters remaining")).toBeTruthy();
  });

  it("shows 'Minimum length met' when 20+ characters entered", () => {
    render(<RejectionReasonModal {...defaultProps} />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, {
      target: { value: "This is a valid reason with enough characters" },
    });
    expect(screen.getByText("Minimum length met")).toBeTruthy();
  });

  it("submit button is disabled when reason is less than 20 characters", () => {
    render(<RejectionReasonModal {...defaultProps} />);
    const submitButton = screen.getByRole("button", {
      name: /submit rejection/i,
    });
    expect((submitButton as HTMLButtonElement).disabled).toBe(true);
  });

  it("submit button is enabled when reason is 20+ characters", () => {
    render(<RejectionReasonModal {...defaultProps} />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, {
      target: { value: "This is a valid reason with enough characters" },
    });
    const submitButton = screen.getByRole("button", {
      name: /submit rejection/i,
    });
    expect((submitButton as HTMLButtonElement).disabled).toBe(false);
  });

  it("calls onSubmit with reason when form is submitted", async () => {
    mockOnSubmit.mockResolvedValue(undefined);
    render(<RejectionReasonModal {...defaultProps} />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, {
      target: { value: "This is a valid reason with enough characters" },
    });
    const submitButton = screen.getByRole("button", {
      name: /submit rejection/i,
    });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        "This is a valid reason with enough characters",
      );
    });
  });

  it("calls onClose when close button is clicked", () => {
    render(<RejectionReasonModal {...defaultProps} />);
    const closeButton = screen.getByRole("button", { name: /close modal/i });
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onClose when ESC key is pressed", () => {
    render(<RejectionReasonModal {...defaultProps} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("does not close on ESC when submitting", () => {
    mockOnSubmit.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000)),
    );
    render(<RejectionReasonModal {...defaultProps} />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, {
      target: { value: "This is a valid reason with enough characters" },
    });
    const submitButton = screen.getByRole("button", {
      name: /submit rejection/i,
    });
    fireEvent.click(submitButton);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("has aria-modal attribute for accessibility", () => {
    render(<RejectionReasonModal {...defaultProps} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
  });

  it("shows error message when submission fails", async () => {
    mockOnSubmit.mockRejectedValue(new Error("Network error"));
    render(<RejectionReasonModal {...defaultProps} />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, {
      target: { value: "This is a valid reason with enough characters" },
    });
    const submitButton = screen.getByRole("button", {
      name: /submit rejection/i,
    });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeTruthy();
    });
  });

  it("resets state when modal closes", () => {
    const { rerender } = render(<RejectionReasonModal {...defaultProps} />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, {
      target: { value: "This is a valid reason with enough characters" },
    });
    rerender(<RejectionReasonModal {...defaultProps} isOpen={false} />);
    rerender(<RejectionReasonModal {...defaultProps} isOpen={true} />);
    const newTextarea = screen.getByRole("textbox");
    expect((newTextarea as HTMLTextAreaElement).value).toBe("");
  });

  it("clears selected chip when user modifies text", () => {
    render(<RejectionReasonModal {...defaultProps} />);
    const chip = screen.getByText("Incomplete documents");
    fireEvent.click(chip);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, {
      target: { value: "Incomplete documents - modified" },
    });
    // Chip should no longer have selected styling
    expect(chip.className).not.toContain("bg-[#E84D2A]");
  });
});
