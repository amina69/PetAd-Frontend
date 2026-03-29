import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ApprovalDecisionButtons } from "../ApprovalDecisionButtons";

// Mock modules
vi.mock("../../../hooks/useRoleGuard", () => ({
  useRoleGuard: vi.fn(),
}));

vi.mock("../../../hooks/useAdoptionApprovals", () => ({
  useAdoptionApprovals: vi.fn(),
}));

vi.mock("../../../hooks/useApiMutation", () => ({
  useApiMutation: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../../api/adoptionApprovalsService", () => ({
  adoptionApprovalsService: {
    submitApprovalDecision: vi.fn(),
  },
}));

vi.mock("../../modals/RejectionReasonModal", () => ({
  RejectionReasonModal: ({
    isOpen,
    onClose,
    onSubmit,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => Promise<void>;
  }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="rejection-modal">
        <button
          onClick={async () => {
            await onSubmit("rejection reason test");
          }}
          data-testid="modal-submit"
        >
          Submit Rejection
        </button>
        <button onClick={onClose} data-testid="modal-close">
          Close Modal
        </button>
      </div>
    );
  },
}));

import { useRoleGuard } from "../../../hooks/useRoleGuard";
import { useAdoptionApprovals } from "../../../hooks/useAdoptionApprovals";
import { useApiMutation } from "../../../hooks/useApiMutation";
import { toast } from "react-hot-toast";

const mockMutate = vi.fn();
const mockMutateAsync = vi.fn().mockResolvedValue({});

const mockApprovalParty = {
  id: "party-1",
  name: "Dr. Sarah Lee",
  role: "Veterinary Inspector",
  status: "PENDING" as const,
};

const mockApprovedParty = {
  id: "party-2",
  name: "Mark Evans",
  role: "Welfare Officer",
  status: "APPROVED" as const,
};

const defaultMockAdoptionApprovals = {
  required: 3,
  given: 1,
  pending: 2,
  quorumMet: false,
  escrowAccountId: "escrow-123",
  parties: [mockApprovalParty, mockApprovedParty],
  isLoading: false,
  isError: false,
};

let mockMutationCallbacks: {
  onSuccess?: (data: any, variables: any) => void;
  onError?: (error: any) => void;
} = {};

beforeEach(() => {
  vi.clearAllMocks();
  mockMutationCallbacks = {};

  vi.mocked(useRoleGuard).mockReturnValue({
    role: "admin",
    isAdmin: true,
    isUser: false,
  });

  vi.mocked(useAdoptionApprovals).mockReturnValue(
    defaultMockAdoptionApprovals,
  );

  // Mock useApiMutation to capture callbacks
  vi.mocked(useApiMutation).mockImplementation((mutationFn, options) => {
    // Capture the callbacks for later use in tests
    if (options) {
      mockMutationCallbacks = options;
    }

    return {
      mutate: mockMutate,
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
      error: null,
    };
  });
});

describe("ApprovalDecisionButtons", () => {
  describe("Visibility", () => {
    it("shows loading state when data is loading", () => {
      vi.mocked(useAdoptionApprovals).mockReturnValue({
        ...defaultMockAdoptionApprovals,
        isLoading: true,
      });

      render(<ApprovalDecisionButtons adoptionId="adoption-123" />);

      expect(screen.getByText("Loading approval status...")).toBeTruthy();
      expect(screen.queryByRole("button", { name: /approve/i })).toBeFalsy();
    });

    it("hides when error loading approvals", () => {
      vi.mocked(useAdoptionApprovals).mockReturnValue({
        ...defaultMockAdoptionApprovals,
        isError: true,
      });

      render(<ApprovalDecisionButtons adoptionId="adoption-123" />);

      expect(screen.queryByRole("button", { name: /approve/i })).toBeFalsy();
    });

    it("hides when there are no pending parties", () => {
      vi.mocked(useAdoptionApprovals).mockReturnValue({
        ...defaultMockAdoptionApprovals,
        parties: [mockApprovedParty],
      });

      render(<ApprovalDecisionButtons adoptionId="adoption-123" />);

      expect(screen.queryByRole("button", { name: /approve/i })).toBeFalsy();
    });

    it("shows buttons when there are pending parties", () => {
      render(<ApprovalDecisionButtons adoptionId="adoption-123" />);

      expect(
        screen.getByRole("button", { name: /approve/i }),
      ).toBeTruthy();
      expect(
        screen.getByRole("button", { name: /reject/i }),
      ).toBeTruthy();
    });
  });

  describe("Approve Button", () => {
    it("calls mutation with APPROVED decision on click", async () => {
      render(<ApprovalDecisionButtons adoptionId="adoption-123" />);

      const approveButton = screen.getByRole("button", { name: /approve/i });
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({ decision: "APPROVED" });
      });
    });

    it("shows success toast after approval", async () => {
      render(<ApprovalDecisionButtons adoptionId="adoption-123" />);

      const approveButton = screen.getByRole("button", { name: /approve/i });
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });

      // Trigger the onSuccess callback
      if (mockMutationCallbacks.onSuccess) {
        mockMutationCallbacks.onSuccess({}, { decision: "APPROVED" });
      }

      expect(toast.success).toHaveBeenCalledWith(
        "Your approval has been recorded",
      );
    });

    it("shows error toast on approval failure", async () => {
      const error = new Error("Network error");
      render(<ApprovalDecisionButtons adoptionId="adoption-123" />);

      const approveButton = screen.getByRole("button", { name: /approve/i });
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });

      // Trigger the onError callback
      if (mockMutationCallbacks.onError) {
        mockMutationCallbacks.onError(error);
      }

      expect(toast.error).toHaveBeenCalledWith("Network error");
    });

    it("disables button while submitting", () => {
      vi.mocked(useApiMutation).mockReturnValue({
        mutate: mockMutate,
        mutateAsync: mockMutateAsync,
        isPending: true,
        isError: false,
        error: null,
      });

      render(<ApprovalDecisionButtons adoptionId="adoption-123" />);

      const approveButton = screen.getByRole("button", { name: /approve/i });
      expect(approveButton).toHaveAttribute("disabled");
    });

    it("shows loading spinner during submission", () => {
      vi.mocked(useApiMutation).mockReturnValue({
        mutate: mockMutate,
        mutateAsync: mockMutateAsync,
        isPending: true,
        isError: false,
        error: null,
      });

      render(<ApprovalDecisionButtons adoptionId="adoption-123" />);

      const approveButton = screen.getByRole("button", { name: /approve/i });
      const spinner = approveButton.querySelector("svg");
      expect(spinner?.classList.contains("animate-spin")).toBeTruthy();
    });
  });

  describe("Reject Button", () => {
    it("opens rejection modal on click", async () => {
      render(<ApprovalDecisionButtons adoptionId="adoption-123" />);

      const rejectButton = screen.getByRole("button", { name: /reject/i });
      fireEvent.click(rejectButton);

      await waitFor(() => {
        expect(screen.getByTestId("rejection-modal")).toBeTruthy();
      });
    });

    it("closes modal when close button is clicked", async () => {
      render(<ApprovalDecisionButtons adoptionId="adoption-123" />);

      const rejectButton = screen.getByRole("button", { name: /reject/i });
      fireEvent.click(rejectButton);

      await waitFor(() => {
        expect(screen.getByTestId("rejection-modal")).toBeTruthy();
      });

      const closeButton = screen.getByTestId("modal-close");
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId("rejection-modal")).toBeFalsy();
      });
    });

    it("calls mutation with REJECTED decision and reason from modal", async () => {
      render(<ApprovalDecisionButtons adoptionId="adoption-123" />);

      const rejectButton = screen.getByRole("button", { name: /reject/i });
      fireEvent.click(rejectButton);

      await waitFor(() => {
        expect(screen.getByTestId("rejection-modal")).toBeTruthy();
      });

      const modalSubmitButton = screen.getByTestId("modal-submit");
      fireEvent.click(modalSubmitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          decision: "REJECTED",
          reason: "rejection reason test",
        });
      });
    });

    it("shows success toast after rejection", async () => {
      render(<ApprovalDecisionButtons adoptionId="adoption-123" />);

      const rejectButton = screen.getByRole("button", { name: /reject/i });
      fireEvent.click(rejectButton);

      await waitFor(() => {
        expect(screen.getByTestId("rejection-modal")).toBeTruthy();
      });

      const modalSubmitButton = screen.getByTestId("modal-submit");
      fireEvent.click(modalSubmitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });

      // Trigger the onSuccess callback
      if (mockMutationCallbacks.onSuccess) {
        mockMutationCallbacks.onSuccess({}, { decision: "REJECTED" });
      }

      expect(toast.success).toHaveBeenCalledWith(
        "Your rejection has been recorded",
      );
    });

    it("disables button while submitting rejection", () => {
      vi.mocked(useApiMutation).mockReturnValue({
        mutate: mockMutate,
        mutateAsync: mockMutateAsync,
        isPending: true,
        isError: false,
        error: null,
      });

      render(<ApprovalDecisionButtons adoptionId="adoption-123" />);

      const rejectButton = screen.getByRole("button", { name: /reject/i });
      expect(rejectButton).toHaveAttribute("disabled");
    });
  });

  describe("Button States", () => {
    it("both buttons are disabled while submitting", () => {
      vi.mocked(useApiMutation).mockReturnValue({
        mutate: mockMutate,
        mutateAsync: mockMutateAsync,
        isPending: true,
        isError: false,
        error: null,
      });

      render(<ApprovalDecisionButtons adoptionId="adoption-123" />);

      const approveButton = screen.getByRole("button", { name: /approve/i });
      const rejectButton = screen.getByRole("button", { name: /reject/i });

      expect(approveButton).toHaveAttribute("disabled");
      expect(rejectButton).toHaveAttribute("disabled");
    });

    it("both buttons are enabled when not submitting", () => {
      render(<ApprovalDecisionButtons adoptionId="adoption-123" />);

      const approveButton = screen.getByRole("button", { name: /approve/i });
      const rejectButton = screen.getByRole("button", { name: /reject/i });

      expect(approveButton).not.toHaveAttribute("disabled");
      expect(rejectButton).not.toHaveAttribute("disabled");
    });
  });

  describe("Accessibility", () => {
    it("approve button has aria-label", () => {
      render(<ApprovalDecisionButtons adoptionId="adoption-123" />);

      const approveButton = screen.getByRole("button", { name: /approve/i });
      expect(approveButton).toHaveAttribute("aria-label");
    });

    it("reject button has aria-label", () => {
      render(<ApprovalDecisionButtons adoptionId="adoption-123" />);

      const rejectButton = screen.getByRole("button", { name: /reject/i });
      expect(rejectButton).toHaveAttribute("aria-label");
    });
  });
});
