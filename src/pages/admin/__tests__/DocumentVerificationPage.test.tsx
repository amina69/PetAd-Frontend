import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DocumentVerificationPage from "../DocumentVerificationPage";
import { documentService } from "../../../api/documentService";

vi.mock("../../../api/documentService");

const makeDoc = (id: string) => ({
  id,
  fileName: `${id}.pdf`,
  fileUrl: `https://example.com/${id}.pdf`,
  mimeType: "application/pdf",
  size: 1,
  uploadedById: "u",
  adoptionId: "a",
  createdAt: "2026-03-01T10:00:00.000Z",
  onChainVerified: null,
  anchorTxHash: null,
  expiresAt: null,
  type: "VACCINATION",
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DocumentVerificationPage />
    </QueryClientProvider>,
  );
}

describe("DocumentVerificationPage", () => {
  beforeEach(() => {
    localStorage.setItem("petad_user_role", "ADMIN");
    vi.mocked(documentService.getPendingDocuments).mockResolvedValue([
      makeDoc("doc-1"),
      makeDoc("doc-2"),
    ]);
    vi.mocked(documentService.reviewDocument).mockResolvedValue(makeDoc("doc-1") as never);
  });

  it("navigates with J/K", async () => {
    renderPage();
    await screen.findByRole("heading", { name: "doc-1.pdf" });
    fireEvent.keyDown(window, { key: "j" });
    expect(await screen.findByRole("heading", { name: "doc-2.pdf" })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "k" });
    expect(await screen.findByRole("heading", { name: "doc-1.pdf" })).toBeInTheDocument();
  });

  it("never fires shortcuts while a text field is focused", async () => {
    renderPage();
    await screen.findByRole("heading", { name: "doc-1.pdf" });
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    const textarea = await screen.findByRole("textbox");
    fireEvent.keyDown(textarea, { key: "v" });
    fireEvent.keyDown(textarea, { key: "j" });
    expect(documentService.reviewDocument).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "doc-1.pdf" })).toBeInTheDocument();
  });

  it("loads the next document automatically after verifying", async () => {
    // After the decision the server no longer returns the decided document.
    vi.mocked(documentService.getPendingDocuments)
      .mockResolvedValueOnce([makeDoc("doc-1"), makeDoc("doc-2")])
      .mockResolvedValue([makeDoc("doc-2")]);
    renderPage();
    await screen.findByRole("heading", { name: "doc-1.pdf" });
    fireEvent.keyDown(window, { key: "v" });
    await waitFor(() =>
      expect(documentService.reviewDocument).toHaveBeenCalledWith("doc-1", {
        status: "APPROVED",
        reason: undefined,
      }),
    );
    expect(await screen.findByRole("heading", { name: "doc-2.pdf" })).toBeInTheDocument();
  });
});
