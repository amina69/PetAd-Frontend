import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../../lib/api-errors";
import { documentService } from "../../../api/documentService";
import { ReplaceDocumentButton } from "../components/ReplaceDocumentButton";
import { DocumentStatusBadge } from "../components/DocumentStatusBadge";
import { DocumentUploadPanel } from "../components/DocumentUploadPanel";

vi.mock("../../../api/documentService", () => ({
  documentService: {
    replaceDocument: vi.fn(),
    uploadDocument: vi.fn(),
  },
}));

function renderWithClient(node: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

describe("DocumentStatusBadge", () => {
  it("renders pending, approved, and rejected labels", () => {
    const { rerender } = render(<DocumentStatusBadge status="PENDING" />);
    expect(screen.getByTestId("document-status")).toHaveTextContent("Pending");
    rerender(<DocumentStatusBadge status="APPROVED" />);
    expect(screen.getByTestId("document-status")).toHaveTextContent("Approved");
    rerender(<DocumentStatusBadge status="REJECTED" />);
    expect(screen.getByTestId("document-status")).toHaveTextContent("Rejected");
    rerender(<DocumentStatusBadge status={null} />);
    expect(screen.getByTestId("document-status")).toHaveTextContent("Pending");
  });
});

describe("ReplaceDocumentButton", () => {
  beforeEach(() => {
    vi.mocked(documentService.replaceDocument).mockReset();
  });

  it("replaces a valid file", async () => {
    vi.mocked(documentService.replaceDocument).mockResolvedValue();
    renderWithClient(<ReplaceDocumentButton documentId="doc-1" documentType="ID" />);

    const file = new File(["pdf"], "next.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByTestId("replace-input-doc-1"), { target: { files: [file] } });

    await waitFor(() => {
      expect(documentService.replaceDocument).toHaveBeenCalledWith(
        "doc-1",
        expect.objectContaining({ file, type: "ID" }),
      );
    });
  });

  it("shows a validation error and does not call the API", async () => {
    renderWithClient(<ReplaceDocumentButton documentId="doc-1" documentType="ID" />);
    const file = new File(["gif"], "anim.gif", { type: "image/gif" });
    fireEvent.change(screen.getByTestId("replace-input-doc-1"), { target: { files: [file] } });
    expect(await screen.findByRole("alert")).toHaveTextContent("Unsupported file type");
    expect(documentService.replaceDocument).not.toHaveBeenCalled();
  });

  it("shows an API failure", async () => {
    vi.mocked(documentService.replaceDocument).mockRejectedValue(
      new ApiError("Replace failed", { status: 500 }),
    );
    renderWithClient(<ReplaceDocumentButton documentId="doc-1" documentType="ID" />);
    const file = new File(["pdf"], "next.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByTestId("replace-input-doc-1"), { target: { files: [file] } });
    expect(await screen.findByRole("alert")).toHaveTextContent("Replace failed");
  });
});

describe("DocumentUploadPanel", () => {
  beforeEach(() => {
    vi.mocked(documentService.uploadDocument).mockReset();
  });

  it("reports progress and completes", async () => {
    vi.mocked(documentService.uploadDocument).mockImplementation(async (options) => {
      options.onProgress?.(50);
      options.onProgress?.(100);
    });
    renderWithClient(<DocumentUploadPanel />);
    const file = new File(["pdf"], "sample.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("Upload document"), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Upload" }));
    await waitFor(() => {
      expect(documentService.uploadDocument).toHaveBeenCalled();
    });
  });

  it("cancels an in-flight upload and retries", async () => {
    vi.mocked(documentService.uploadDocument).mockImplementation(
      (options) =>
        new Promise((resolve, reject) => {
          options.onProgress?.(25);
          options.signal?.addEventListener("abort", () => {
            reject(new ApiError("Upload cancelled", { code: "ABORTED" }));
          });
          if (!options.signal) resolve();
        }),
    );

    renderWithClient(<DocumentUploadPanel />);
    const file = new File(["pdf"], "sample.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("Upload document"), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Upload" }));
    expect(await screen.findByRole("status")).toHaveTextContent("25%");

    fireEvent.click(screen.getByRole("button", { name: "Cancel upload" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Upload cancelled");

    vi.mocked(documentService.uploadDocument).mockResolvedValue();
    fireEvent.click(screen.getByRole("button", { name: "Retry upload" }));
    await waitFor(() => {
      expect(documentService.uploadDocument).toHaveBeenCalledTimes(2);
    });
  });

  it("offers retry after a failed upload", async () => {
    vi.mocked(documentService.uploadDocument)
      .mockRejectedValueOnce(new ApiError("Scanner rejected the file", { status: 422 }))
      .mockResolvedValueOnce();

    renderWithClient(<DocumentUploadPanel />);
    const file = new File(["pdf"], "sample.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("Upload document"), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Upload" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Scanner rejected the file");
    fireEvent.click(screen.getByRole("button", { name: "Retry upload" }));
    await waitFor(() => {
      expect(documentService.uploadDocument).toHaveBeenCalledTimes(2);
    });
  });

  it("rejects an invalid file before upload", async () => {
    renderWithClient(<DocumentUploadPanel />);
    const file = new File(["x"], "notes.txt", { type: "text/plain" });
    fireEvent.change(screen.getByLabelText("Upload document"), { target: { files: [file] } });
    expect(await screen.findByRole("alert")).toHaveTextContent("Unsupported file type");
    expect(screen.getByRole("button", { name: "Upload" })).toBeDisabled();
  });
});
