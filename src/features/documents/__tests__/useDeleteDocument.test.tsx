import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../../lib/api-errors";
import type { Document } from "../../../types/documents";
import { documentService } from "../../../api/documentService";
import { DocumentList } from "../components/DocumentList";
import { deletionErrorMessage, isConflictError } from "../hooks/useDeleteDocument";
import { queryKeys } from "../../../lib/queryKeys";

vi.mock("../../../api/documentService", () => ({
  documentService: {
    deleteDocument: vi.fn(),
    getDocuments: vi.fn(),
    replaceDocument: vi.fn(),
  },
}));

const IN_REVIEW_MESSAGE =
  "This document is attached to an application that is in review and cannot be deleted.";

function makeDoc(overrides: Partial<Document> = {}): Document {
  return {
    id: "doc-1",
    fileName: "vaccination.pdf",
    fileUrl: "https://example.com/vaccination.pdf",
    mimeType: "application/pdf",
    size: 1000,
    uploadedById: "user-1",
    adoptionId: "adoption-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    onChainVerified: null,
    anchorTxHash: null,
    expiresAt: null,
    type: "ID",
    status: "PENDING",
    ...overrides,
  };
}

let serverDocs: Document[] = [];

function renderList() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  function Harness() {
    const query = useQuery({
      queryKey: queryKeys.documents.list(),
      queryFn: () => documentService.getDocuments(),
    });
    if (!query.data) return <p>Loading documents…</p>;
    return <DocumentList documents={query.data} />;
  }

  return render(
    <QueryClientProvider client={client}>
      <Harness />
    </QueryClientProvider>,
  );
}

describe("deletion errors", () => {
  it("explains a 409 and falls back when the body is empty", () => {
    expect(deletionErrorMessage(new ApiError(IN_REVIEW_MESSAGE, { status: 409 }))).toBe(
      IN_REVIEW_MESSAGE,
    );
    expect(deletionErrorMessage(new ApiError("", { status: 409 }))).toMatch(/in review/);
    expect(isConflictError(new ApiError("nope", { status: 500 }))).toBe(false);
    expect(deletionErrorMessage(new Error("network"))).toBe("network");
    expect(deletionErrorMessage("nope")).toBe("Failed to delete document.");
  });
});

describe("DocumentList delete", () => {
  beforeEach(() => {
    serverDocs = [
      makeDoc(),
      makeDoc({
        id: "doc-locked",
        fileName: "packet.pdf",
        applicationInReview: true,
        status: "IN_REVIEW",
      }),
    ];
    vi.mocked(documentService.getDocuments).mockReset();
    vi.mocked(documentService.deleteDocument).mockReset();
    vi.mocked(documentService.replaceDocument).mockReset();
    vi.mocked(documentService.getDocuments).mockImplementation(async () => [...serverDocs]);
    vi.mocked(documentService.deleteDocument).mockImplementation(async (id: string) => {
      const target = serverDocs.find((doc) => doc.id === id);
      if (target?.applicationInReview) {
        throw new ApiError(IN_REVIEW_MESSAGE, { status: 409 });
      }
      serverDocs = serverDocs.filter((doc) => doc.id !== id);
    });
    vi.mocked(documentService.replaceDocument).mockResolvedValue();
  });

  it("removes a document after confirmation", async () => {
    renderList();
    expect(await screen.findByText("vaccination.pdf")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete vaccination.pdf" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));

    await waitFor(() => {
      expect(screen.queryByText("vaccination.pdf")).not.toBeInTheDocument();
    });
    expect(screen.getByText("packet.pdf")).toBeInTheDocument();
  });

  it("shows the 409 reason and restores the row", async () => {
    let release: (() => void) | undefined;
    vi.mocked(documentService.deleteDocument).mockImplementation(
      (id: string) =>
        new Promise((resolve, reject) => {
          release = () => {
            const target = serverDocs.find((doc) => doc.id === id);
            if (target?.applicationInReview) {
              reject(new ApiError(IN_REVIEW_MESSAGE, { status: 409 }));
              return;
            }
            resolve();
          };
        }),
    );

    renderList();
    expect(await screen.findByText("packet.pdf")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete packet.pdf" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));

    await waitFor(() => {
      expect(screen.queryByText("packet.pdf")).not.toBeInTheDocument();
    });

    release?.();

    expect(await screen.findByRole("alert")).toHaveTextContent(IN_REVIEW_MESSAGE);
    expect(await screen.findByText("packet.pdf")).toBeInTheDocument();
  });

  it("cancels the confirmation dialog without deleting", async () => {
    renderList();
    expect(await screen.findByText("vaccination.pdf")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete vaccination.pdf" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(documentService.deleteDocument).not.toHaveBeenCalled();
  });
});
