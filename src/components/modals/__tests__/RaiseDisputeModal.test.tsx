import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { RaiseDisputeModal } from "../RaiseDisputeModal";
import * as disputeHookModule from "../../../hooks/useMutateRaiseDispute";

// ── Mocks ─────────────────────────────────────────────────────────────────
vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock("../../../hooks/useMutateRaiseDispute", () => ({
  useMutateRaiseDispute: vi.fn(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const renderModal = (props?: Partial<React.ComponentProps<typeof RaiseDisputeModal>>) => {
  const qc = createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <RaiseDisputeModal
        isOpen={true}
        onClose={vi.fn()}
        adoptionId="a-1"
        raisedBy="u-1"
        {...props}
      />
    </QueryClientProvider>,
  );
};

const mockHook = (overrides?: Partial<{ mutateAsync: any; isPending: boolean; error: any }>) => {
  vi.mocked(disputeHookModule.useMutateRaiseDispute).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    error: null,
    ...overrides,
  } as any);
};

const LONG_REASON = "This is a long enough reason that exceeds the minimum length requirement.";

// ── Tests ─────────────────────────────────────────────────────────────────
describe("RaiseDisputeModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHook();
  });

  // ── Rendering ────────────────────────────────────────────────────────────
  it("renders when isOpen is true", () => {
    renderModal();
    expect(screen.getByText("Raise a dispute")).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    renderModal({ isOpen: false });
    expect(screen.queryByText("Raise a dispute")).not.toBeInTheDocument();
  });

  // ── Form validation ───────────────────────────────────────────────────────
  it("submit is disabled when reason is empty", () => {
    renderModal();
    expect(screen.getByRole("button", { name: /raise dispute/i })).toBeDisabled();
  });

  it("submit is disabled when reason is under 30 characters", async () => {
    renderModal();
    await userEvent.type(screen.getByRole("textbox"), "too short");
    expect(screen.getByRole("button", { name: /raise dispute/i })).toBeDisabled();
  });

  it("submit is enabled when reason meets minimum length", async () => {
    renderModal();
    await userEvent.type(screen.getByRole("textbox"), LONG_REASON);
    expect(screen.getByRole("button", { name: /raise dispute/i })).not.toBeDisabled();
  });

  it("shows minimum characters hint when under 30", async () => {
    renderModal();
    await userEvent.type(screen.getByRole("textbox"), "too short");
    expect(screen.getByText("Minimum 30 characters")).toBeInTheDocument();
  });

  it("shows live character counter", async () => {
    renderModal();
    await userEvent.type(screen.getByRole("textbox"), "Hello");
    expect(screen.getByText("5 chars")).toBeInTheDocument();
  });

  it("shows inline error when submitting with short reason via fireEvent", () => {
    renderModal();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "short" } });
    // button is disabled when reason < 30 chars so we verify it's disabled
    expect(screen.getByRole("button", { name: /raise dispute/i })).toBeDisabled();
    expect(screen.getByText("Minimum 30 characters")).toBeInTheDocument();
  });

  // ── Submission states ─────────────────────────────────────────────────────
  it("submit is disabled during upload", () => {
    mockHook({ isPending: true });
    renderModal();
    expect(screen.getByRole("button", { name: /submitting/i })).toBeDisabled();
  });

  it("shows Submitting... label while pending", () => {
    mockHook({ isPending: true });
    renderModal();
    expect(screen.getByRole("button", { name: /submitting/i })).toBeInTheDocument();
  });

  it("success closes modal and shows toast", async () => {
    const onClose = vi.fn();
    mockHook({ mutateAsync: vi.fn().mockResolvedValue({}) });
    renderModal({ onClose });

    fireEvent.change(screen.getByRole("textbox"), { target: { value: LONG_REASON } });
    fireEvent.click(screen.getByRole("button", { name: /raise dispute/i }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Dispute raised. Escrow paused.");
    });
  });

  // ── Error handling ────────────────────────────────────────────────────────
  it("shows inline error on mutation failure", async () => {
    mockHook({ mutateAsync: vi.fn().mockRejectedValue(new Error("Server error")) });
    renderModal();

    fireEvent.change(screen.getByRole("textbox"), { target: { value: LONG_REASON } });
    fireEvent.click(screen.getByRole("button", { name: /raise dispute/i }));

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
  });

  it("shows error from hook error state", () => {
    mockHook({ error: { message: "Something went wrong" } });
    renderModal();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  // ── Close behaviour ───────────────────────────────────────────────────────
  it("calls onClose when Cancel is clicked", () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when Escape key is pressed", () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not close on Escape when upload is pending", () => {
    const onClose = vi.fn();
    mockHook({ isPending: true });
    renderModal({ onClose });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByTestId("dispute-backdrop"));
    expect(onClose).toHaveBeenCalledOnce();
  });
});