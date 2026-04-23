import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "../../../mocks/server";
import { RaiseDisputeModal, RaiseDisputeTrigger } from "../RaiseDisputeModal";

// Mock react-hot-toast — jsdom doesn't have matchMedia
vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

import { toast } from "react-hot-toast";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeFile(name = "evidence.pdf", type = "application/pdf") {
  return new File(["content"], name, { type });
}

const DEFAULT_PROPS = {
  isOpen: true,
  onClose: vi.fn(),
  adoptionId: "adoption-123",
  adoptionStatus: "CUSTODY_ACTIVE" as const,
  userId: "user-abc",
  userRole: "USER" as const,
};

function renderModal(props = DEFAULT_PROPS) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <RaiseDisputeModal {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("RaiseDisputeTrigger", () => {
  it("renders for USER when status is CUSTODY_ACTIVE", () => {
    render(
      <RaiseDisputeTrigger
        adoptionStatus="CUSTODY_ACTIVE"
        userRole="USER"
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByTestId("raise-dispute-trigger")).toBeInTheDocument();
  });

  it("renders for SHELTER when status is CUSTODY_ACTIVE", () => {
    render(
      <RaiseDisputeTrigger
        adoptionStatus="CUSTODY_ACTIVE"
        userRole="SHELTER"
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByTestId("raise-dispute-trigger")).toBeInTheDocument();
  });

  it("does NOT render for ADMIN", () => {
    render(
      <RaiseDisputeTrigger
        adoptionStatus="CUSTODY_ACTIVE"
        userRole="ADMIN"
        onClick={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("raise-dispute-trigger")).not.toBeInTheDocument();
  });

  it("does NOT render when status is not CUSTODY_ACTIVE", () => {
    render(
      <RaiseDisputeTrigger
        adoptionStatus="ESCROW_FUNDED"
        userRole="USER"
        onClick={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("raise-dispute-trigger")).not.toBeInTheDocument();
  });
});

describe("RaiseDisputeModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  it("renders the modal with correct role and aria attributes", () => {
    renderModal();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "raise-dispute-title");
    expect(screen.getByText("Raise a Dispute")).toBeInTheDocument();
  });

  it("does not render when isOpen=false", () => {
    renderModal({ ...DEFAULT_PROPS, isOpen: false });
    expect(screen.queryByTestId("raise-dispute-modal")).not.toBeInTheDocument();
  });

  it("does not render when adoptionStatus is not CUSTODY_ACTIVE", () => {
    renderModal({ ...DEFAULT_PROPS, adoptionStatus: "ESCROW_FUNDED" });
    expect(screen.queryByTestId("raise-dispute-modal")).not.toBeInTheDocument();
  });

  // ── Reason validation ──────────────────────────────────────────────────────

  it("shows character counter as user types", () => {
    renderModal();
    const textarea = screen.getByTestId("dispute-description");
    fireEvent.change(textarea, { target: { value: "Short" } });
    expect(screen.getByTestId("description-counter")).toHaveTextContent("5 / 30+");
  });

  it("shows validation error after blur when description is too short", () => {
    renderModal();
    const textarea = screen.getByTestId("dispute-description");
    fireEvent.change(textarea, { target: { value: "Too short" } });
    fireEvent.blur(textarea);
    expect(screen.getByTestId("description-error")).toBeInTheDocument();
  });

  it("submit button is disabled when description is too short", () => {
    renderModal();
    const textarea = screen.getByTestId("dispute-description");
    fireEvent.change(textarea, { target: { value: "Too short" } });
    expect(screen.getByTestId("submit-dispute")).toBeDisabled();
  });

  it("submit button is enabled when description meets minimum length", () => {
    renderModal();
    const textarea = screen.getByTestId("dispute-description");
    fireEvent.change(textarea, {
      target: { value: "This is a detailed description that is long enough." },
    });
    expect(screen.getByTestId("submit-dispute")).not.toBeDisabled();
  });

  // ── Submit disabled during upload ──────────────────────────────────────────

  it("submit button is disabled while submission is in progress", async () => {
    // Use a slow handler so we can assert the mid-flight disabled state
    server.use(
      http.post("/api/disputes", async () => {
        await new Promise((r) => setTimeout(r, 300));
        return HttpResponse.json(
          {
            id: "dispute-new",
            adoptionId: "adoption-123",
            raisedBy: "user-abc",
            reason: "test",
            description: "test",
            status: "open",
            isOverdue: false,
            pet: { id: "p1", name: "Max" },
            adopter: { id: "a1", name: "Alice" },
            shelter: { id: "s1", name: "Shelter" },
            evidence: [],
            timeline: [],
            resolution: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          { status: 201 },
        );
      }),
    );

    renderModal();
    const textarea = screen.getByTestId("dispute-description");
    fireEvent.change(textarea, {
      target: { value: "This is a detailed description that is long enough." },
    });

    const submitBtn = screen.getByTestId("submit-dispute");
    expect(submitBtn).not.toBeDisabled(); // enabled before click

    fireEvent.click(submitBtn);

    // Immediately after click — should be disabled while pending
    await waitFor(() => {
      expect(screen.getByTestId("submit-dispute")).toBeDisabled();
    });
  });

  // ── Success: closes modal and shows toast ──────────────────────────────────

  it("on success: closes modal and shows success toast", async () => {
    const onClose = vi.fn();
    renderModal({ ...DEFAULT_PROPS, onClose });

    const textarea = screen.getByTestId("dispute-description");
    fireEvent.change(textarea, {
      target: { value: "This is a detailed description that is long enough." },
    });

    fireEvent.click(screen.getByTestId("submit-dispute"));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });

    expect(toast.success).toHaveBeenCalledWith(
      "Dispute raised. Escrow paused.",
    );
  });

  // ── Error: shows inline error ──────────────────────────────────────────────

  it("shows inline error when submission fails", async () => {
    server.use(
      http.post("/api/disputes", () =>
        HttpResponse.json({ message: "Server error" }, { status: 500 }),
      ),
    );

    renderModal();
    const textarea = screen.getByTestId("dispute-description");
    fireEvent.change(textarea, {
      target: { value: "This is a detailed description that is long enough." },
    });

    fireEvent.click(screen.getByTestId("submit-dispute"));

    await waitFor(() => {
      expect(screen.getByTestId("submit-error")).toBeInTheDocument();
    });

    // Modal stays open on error
    expect(screen.getByTestId("raise-dispute-modal")).toBeInTheDocument();
  });

  // ── Close behaviour ────────────────────────────────────────────────────────

  it("calls onClose when Cancel is clicked", () => {
    const onClose = vi.fn();
    renderModal({ ...DEFAULT_PROPS, onClose });
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when the X button is clicked", () => {
    const onClose = vi.fn();
    renderModal({ ...DEFAULT_PROPS, onClose });
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when clicking the backdrop", () => {
    const onClose = vi.fn();
    renderModal({ ...DEFAULT_PROPS, onClose });
    fireEvent.click(screen.getByTestId("raise-dispute-modal-overlay"));
    expect(onClose).toHaveBeenCalled();
  });

  it("closes on Escape key", async () => {
    const onClose = vi.fn();
    renderModal({ ...DEFAULT_PROPS, onClose });
    await act(async () => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    expect(onClose).toHaveBeenCalled();
  });

  // ── Evidence upload ────────────────────────────────────────────────────────

  it("renders the evidence upload zone", () => {
    renderModal();
    // EvidenceUpload renders a drop zone
    expect(
      screen.getByRole("button", {
        name: /drop files here or press enter to browse/i,
      }),
    ).toBeInTheDocument();
  });
});
