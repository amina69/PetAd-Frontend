import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Document } from "../../../../types/documents";
import { DocumentList } from "../DocumentList";

const rejected: Document = {
  id: "doc-rejected",
  fileName: "id-scan.pdf",
  fileUrl: "https://example.test/id-scan.pdf",
  mimeType: "application/pdf",
  size: 12000,
  uploadedById: "user-1",
  adoptionId: "adoption-1",
  createdAt: "2026-03-18T08:00:00.000Z",
  onChainVerified: false,
  anchorTxHash: null,
  expiresAt: null,
  type: "ID",
  kind: "ID",
  verificationStatus: "REJECTED",
  rejectionReason: "Photo is blurry",
};

describe("DocumentList", () => {
  it("shows the rejection reason and a Replace action", async () => {
    const onReplace = vi.fn();
    const user = userEvent.setup();
    render(<DocumentList documents={[rejected]} onReplace={onReplace} />);

    expect(screen.getByTestId("rejection-reason-doc-rejected")).toHaveTextContent("Photo is blurry");
    await user.click(screen.getByRole("button", { name: "Replace" }));
    expect(onReplace).toHaveBeenCalledWith(rejected);
  });
});
