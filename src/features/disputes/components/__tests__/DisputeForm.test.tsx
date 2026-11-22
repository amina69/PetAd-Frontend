import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DisputeForm } from "../DisputeForm";
import { documentService } from "../../../../api/documentService";
import { disputeFormSchema } from "../../schemas/disputeSchemas";

vi.mock("../../../../api/documentService", () => ({
  documentService: {
    uploadDocument: vi.fn(),
  },
}));

const uploadMock = vi.mocked(documentService.uploadDocument);

const VALID_DESCRIPTION =
  "The pet arrived with an undisclosed health condition and the shelter has not responded to my messages.";

function selectFiles(files: File[]) {
  const input = screen.getByLabelText("Upload evidence") as HTMLInputElement;
  fireEvent.change(input, { target: { files } });
}

function fileWithSize(name: string, type: string, size: number): File {
  const created = new File(["x"], name, { type });
  Object.defineProperty(created, "size", { value: size });
  return created;
}

describe("DisputeForm evidence attachments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uploadMock.mockImplementation(async ({ file }) => ({
      id: `doc-${file.name}`,
      fileName: file.name,
      size: file.size,
      mimeType: file.type,
    }));
  });

  it("renders every reason option with the product copy", () => {
    render(<DisputeForm onSubmit={vi.fn()} />);

    expect(screen.getByRole("option", { name: "Pet condition" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Custody violation" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Payment issue" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Other" })).toBeInTheDocument();
  });

  it("never calls submit for an invalid form", async () => {
    const onSubmit = vi.fn();
    render(<DisputeForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "Submit dispute" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      await screen.findByText("Select a reason for the dispute."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Please provide more detail (at least 50 characters)"),
    ).toBeInTheDocument();
  });

  it("stores uploaded ids in attachmentIds on submit", async () => {
    const onSubmit = vi.fn();
    render(
      <DisputeForm onSubmit={onSubmit} adoptionOrCustodyId="adoption-1" />,
    );

    fireEvent.change(screen.getByTestId("dispute-reason"), {
      target: { value: "pet_condition" },
    });
    fireEvent.change(screen.getByTestId("dispute-description"), {
      target: { value: VALID_DESCRIPTION },
    });
    selectFiles([
      new File(["hello"], "evidence.pdf", { type: "application/pdf" }),
    ]);

    expect(await screen.findByTestId("attachment-chip")).toBeInTheDocument();
    expect(screen.getByText("evidence.pdf")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Submit dispute" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        reason: "pet_condition",
        description: VALID_DESCRIPTION,
        attachmentIds: ["doc-evidence.pdf"],
        adoptionOrCustodyId: "adoption-1",
      });
    });

    expect(disputeFormSchema.safeParse(onSubmit.mock.calls[0][0]).success).toBe(
      true,
    );
  });

  it("removes the id from the submitted payload when a chip is removed", async () => {
    const onSubmit = vi.fn();
    render(
      <DisputeForm onSubmit={onSubmit} adoptionOrCustodyId="adoption-1" />,
    );

    fireEvent.change(screen.getByTestId("dispute-reason"), {
      target: { value: "payment_issue" },
    });
    fireEvent.change(screen.getByTestId("dispute-description"), {
      target: { value: VALID_DESCRIPTION },
    });
    selectFiles([
      new File(["one"], "keep.pdf", { type: "application/pdf" }),
      new File(["two"], "remove.png", { type: "image/png" }),
    ]);

    await waitFor(() => {
      expect(screen.getAllByTestId("attachment-chip")).toHaveLength(2);
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Remove remove.png" }),
    );

    await waitFor(() => {
      expect(screen.getAllByTestId("attachment-chip")).toHaveLength(1);
    });

    fireEvent.click(screen.getByRole("button", { name: "Submit dispute" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          attachmentIds: ["doc-keep.pdf"],
        }),
      );
    });
  });

  it("shows a specific message for a wrong-type attachment and blocks submit", async () => {
    const onSubmit = vi.fn();
    render(<DisputeForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByTestId("dispute-reason"), {
      target: { value: "other" },
    });
    fireEvent.change(screen.getByTestId("dispute-description"), {
      target: { value: VALID_DESCRIPTION },
    });

    selectFiles([
      new File(["malware"], "malware.exe", {
        type: "application/x-msdownload",
      }),
    ]);

    expect(
      await screen.findByText(
        "malware.exe is not allowed. Use PDF, JPG or PNG.",
      ),
    ).toBeInTheDocument();
    expect(uploadMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("attachment-chip")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Submit dispute" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      await screen.findByText(
        "Remove or retry the invalid attachment before submitting.",
      ),
    ).toBeInTheDocument();
  });

  it("shows a specific message for an oversized attachment", async () => {
    render(<DisputeForm onSubmit={vi.fn()} />);

    selectFiles([
      fileWithSize("huge.pdf", "application/pdf", 11 * 1024 * 1024),
    ]);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("huge.pdf");
    expect(alert).toHaveTextContent("too large");
    expect(uploadMock).not.toHaveBeenCalled();
  });
});
