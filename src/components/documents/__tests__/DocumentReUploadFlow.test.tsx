import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, vi, expect, beforeEach } from "vitest";
import DocumentReUploadFlow from "../DocumentReUploadFlow";
import * as documentsService from "../../../api/documentsService";
import { queryClient } from "../../../lib/query-client";

describe("DocumentReUploadFlow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls replace endpoint and invalidates + toasts on success", async () => {
    const replaceSpy = vi.spyOn(documentsService.documentsService, "replace").mockResolvedValueOnce({} as any);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries").mockImplementation(() => {} as any);
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(<DocumentReUploadFlow documentId="doc-123" documentType="Passport" />);

    // Open modal
    const button = screen.getByRole("button", { name: /Re-upload/i });
    await userEvent.click(button);

    // Select file via the labelled file input
    const fileInput = screen.getByLabelText(/Select Passport/i) as HTMLInputElement;
    const file = new File(["dummy"], "passport.pdf", { type: "application/pdf" });

    // fire change event
    await userEvent.upload(fileInput, file);

    // Submit
    const uploadBtn = screen.getByRole("button", { name: /Upload/i });
    await userEvent.click(uploadBtn);

    // Assertions
    expect(replaceSpy).toHaveBeenCalledWith("doc-123", { fileName: "passport.pdf" });
    expect(invalidateSpy).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith("Document updated");
  });
});
