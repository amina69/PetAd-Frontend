import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RaiseDisputeModal } from "../hooks/RaiseDisputeModal";
import * as useMutateRaiseDisputeModule from "../hooks/useMutateRaiseDispute";

// Mock the FileUpload component since it's an external dependency
vi.mock("../components/ui/fileUpload", () => ({
  FileUpload: ({ id, label, onChange }: { id: string; label: string; onChange: (file: File | null) => void }) => (
    <div data-testid={`file-upload-${id}`}>
      <label>{label}</label>
      <input
        type="file"
        data-testid={`file-input-${id}`}
        onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
      />
    </div>
  ),
}));

// Mock SubmitButton
vi.mock("../components/ui/submitButton", () => ({
  SubmitButton: ({ label, isLoading }: { label: string; isLoading: boolean }) => (
    <button type="submit" disabled={isLoading} data-testid="submit-btn">
      {isLoading ? "Submitting..." : label}
    </button>
  ),
}));

describe("RaiseDisputeModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    targetId: "target-123",
  };

  let mockMutateAsync: vi.Mock;
  let mockProgress = 0;
  let mockResetProgress: vi.Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync = vi.fn().mockResolvedValue(undefined);
    mockResetProgress = vi.fn(() => { mockProgress = 0; });
    mockProgress = 0;
    
    vi.spyOn(useMutateRaiseDisputeModule, "useMutateRaiseDispute").mockImplementation(() => ({
      mutateAsync: mockMutateAsync,
      progress: mockProgress,
      resetProgress: mockResetProgress,
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders correctly when open", () => {
    render(<RaiseDisputeModal {...defaultProps} />);
    expect(screen.getByText("Raise a Dispute")).toBeTruthy();
    expect(screen.getByPlaceholderText("Describe the issue in detail...")).toBeTruthy();
  });

  it("does not render when closed", () => {
    render(<RaiseDisputeModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("Raise a Dispute")).toBeNull();
  });

  it("validates reason length", async () => {
    render(<RaiseDisputeModal {...defaultProps} />);
    
    const reasonInput = screen.getByPlaceholderText("Describe the issue in detail...");
    fireEvent.change(reasonInput, { target: { value: "Short reason" } });
    
    fireEvent.click(screen.getByTestId("submit-btn"));
    
    expect(await screen.findByText("Reason must be at least 30 characters long.")).toBeTruthy();
  });

  it("submits disabled during upload, success closes modal and shows toast", async () => {
    vi.useFakeTimers();

    // Setup a delayed promise so we can observe the "submitting" state
    let resolveMutation: (value?: unknown) => void;
    mockMutateAsync.mockReturnValue(
      new Promise((resolve) => {
        resolveMutation = resolve;
      })
    );

    const { rerender } = render(<RaiseDisputeModal {...defaultProps} />);
    
    const reasonInput = screen.getByPlaceholderText("Describe the issue in detail...");
    fireEvent.change(reasonInput, { 
      target: { value: "This is a sufficiently long reason to pass the minimum length validation check." } 
    });
    
    const submitBtn = screen.getByTestId("submit-btn");
    fireEvent.click(submitBtn);
    
    // During submission, button should be disabled
    await waitFor(() => {
      expect((submitBtn as HTMLButtonElement).disabled).toBe(true);
    });

    // Simulate upload progress
    act(() => {
      vi.spyOn(useMutateRaiseDisputeModule, "useMutateRaiseDispute").mockImplementation(() => ({
        mutateAsync: mockMutateAsync,
        progress: 50,
        resetProgress: mockResetProgress,
      }));
    });
    
    rerender(<RaiseDisputeModal {...defaultProps} />);
    
    expect(screen.getByText("50%")).toBeTruthy();

    // Resolve the mutation
    act(() => {
      resolveMutation();
    });

    // Check for success toast
    await waitFor(() => {
      expect(screen.getByTestId("toast-success")).toBeTruthy();
      expect(screen.getByText("Dispute raised. Escrow paused.")).toBeTruthy();
    });

    // Advance timers for toast to disappear and modal to close
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalled();
      expect(screen.queryByTestId("toast-success")).toBeNull();
    });

    vi.useRealTimers();
  });

  it("shows inline error on upload failure", async () => {
    mockMutateAsync.mockRejectedValue(new Error("Invalid target ID"));

    render(<RaiseDisputeModal {...defaultProps} />);
    
    const reasonInput = screen.getByPlaceholderText("Describe the issue in detail...");
    fireEvent.change(reasonInput, { 
      target: { value: "This is a sufficiently long reason to pass the minimum length validation check." } 
    });
    
    fireEvent.click(screen.getByTestId("submit-btn"));

    await waitFor(() => {
      expect(screen.getByText("Invalid target ID")).toBeTruthy();
    });
    
    const submitBtn = screen.getByTestId("submit-btn");
    expect((submitBtn as HTMLButtonElement).disabled).toBe(false);
  });
});