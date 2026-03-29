import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AdminDocumentReviewPanel } from "../AdminDocumentReviewPanel";
import type { AdoptionDocument } from "../../../types/document";

vi.mock("../../../hooks/useRoleGuard", () => ({
  useRoleGuard: vi.fn(),
}));

vi.mock("../../../hooks/useApiQuery", () => ({
  useApiQuery: vi.fn(),
}));

vi.mock("../../../hooks/useMutateReviewDocument", () => ({
  useMutateReviewDocument: vi.fn(),
}));

import { useRoleGuard } from "../../../hooks/useRoleGuard";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { useMutateReviewDocument } from "../../../hooks/useMutateReviewDocument";

const mockUseRoleGuard = vi.mocked(useRoleGuard);
const mockUseApiQuery = vi.mocked(useApiQuery);
const mockUseMutateReviewDocument = vi.mocked(useMutateReviewDocument);

const seedDocuments: AdoptionDocument[] = [
  {
    id: "doc-1",
    fileName: "identity-proof.pdf",
    fileUrl: "https://example.com/identity-proof.pdf",
    publicId: "adoptions/adoption-001/identity-proof",
    mimeType: "application/pdf",
    size: 1024,
    uploadedById: "user-1",
    adoptionId: "adoption-001",
    createdAt: "2026-03-28T10:00:00.000Z",
    updatedAt: "2026-03-28T10:00:00.000Z",
    onChainVerified: true,
    anchorTxHash: "tx-hash-1",
    reviewStatus: "APPROVED",
    reviewReason: null,
  },
  {
    id: "doc-2",
    fileName: "home-checklist.pdf",
    fileUrl: "https://example.com/home-checklist.pdf",
    publicId: "adoptions/adoption-001/home-checklist",
    mimeType: "application/pdf",
    size: 2048,
    uploadedById: "user-1",
    adoptionId: "adoption-001",
    createdAt: "2026-03-28T11:00:00.000Z",
    updatedAt: "2026-03-28T11:00:00.000Z",
    onChainVerified: null,
    anchorTxHash: null,
    reviewStatus: "PENDING",
    reviewReason: null,
  },
];

describe("AdminDocumentReviewPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseRoleGuard.mockReturnValue({
      role: "admin",
      isAdmin: true,
      isUser: false,
    });

    mockUseApiQuery.mockReturnValue({
      data: seedDocuments,
      isLoading: false,
      isError: false,
      isForbidden: false,
      isNotFound: false,
      error: null,
    });

    mockUseMutateReviewDocument.mockReturnValue({
      mutateReviewDocument: vi.fn(async ({ documentId, decision, reason }) => {
        const existing = seedDocuments.find((doc) => doc.id === documentId);
        if (!existing) {
          throw new Error("Document not found in test seed");
        }

        return {
          ...existing,
          reviewStatus: decision,
          reviewReason: decision === "REJECTED" ? (reason ?? "") : null,
          updatedAt: "2026-03-29T00:00:00.000Z",
        };
      }),
      isPending: false,
      isError: false,
      error: null,
    });
  });

  it("is hidden for non-admin users", () => {
    mockUseRoleGuard.mockReturnValue({
      role: "user",
      isAdmin: false,
      isUser: true,
    });

    render(<AdminDocumentReviewPanel adoptionId="adoption-001" />);

    expect(screen.queryByLabelText("Document verification panel")).not.toBeInTheDocument();
  });

  it("shows inline reject reason input before rejection submission", async () => {
    const mutateReviewDocument = vi.fn(async ({ documentId, decision, reason }) => {
      const existing = seedDocuments.find((doc) => doc.id === documentId);
      if (!existing) {
        throw new Error("Document not found in test seed");
      }

      return {
        ...existing,
        reviewStatus: decision,
        reviewReason: reason ?? null,
      };
    });

    mockUseMutateReviewDocument.mockReturnValue({
      mutateReviewDocument,
      isPending: false,
      isError: false,
      error: null,
    });

    render(<AdminDocumentReviewPanel adoptionId="adoption-001" />);

    const targetRow = screen.getByTestId("document-row-doc-2");
    fireEvent.click(within(targetRow).getByRole("button", { name: "Reject with reason" }));

    const reasonInput = within(targetRow).getByPlaceholderText("Enter rejection reason");
    fireEvent.change(reasonInput, { target: { value: "File is blurry" } });
    fireEvent.click(within(targetRow).getByRole("button", { name: "Submit rejection" }));

    await waitFor(() => {
      expect(mutateReviewDocument).toHaveBeenCalledWith({
        documentId: "doc-2",
        decision: "REJECTED",
        reason: "File is blurry",
      });
    });
  });

  it("updates progress badge after approval", async () => {
    render(<AdminDocumentReviewPanel adoptionId="adoption-001" />);

    expect(screen.getByTestId("review-progress-badge").textContent).toContain(
      "1 of 2 documents approved",
    );

    const pendingRow = screen.getByTestId("document-row-doc-2");
    fireEvent.click(within(pendingRow).getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(screen.getByTestId("review-progress-badge").textContent).toContain(
        "2 of 2 documents approved",
      );
    });

    expect(screen.getByTestId("all-documents-approved-message")).toBeInTheDocument();
  });
});
