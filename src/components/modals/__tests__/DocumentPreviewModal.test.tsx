import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentPreviewModal } from "../DocumentPreviewModal";

describe("DocumentPreviewModal", () => {
  it("refetches an expired preview url once before showing an error", async () => {
    const getDownloadUrl = vi
      .fn()
      .mockResolvedValueOnce("https://files.example/fresh")
      .mockRejectedValueOnce(new Error("expired"));

    render(
      <DocumentPreviewModal
        isOpen
        onClose={vi.fn()}
        getDownloadUrl={getDownloadUrl}
        document={{
          id: "doc-1",
          name: "shot.png",
          mimeType: "image/png",
          url: "https://files.example/expired",
        }}
      />,
    );

    fireEvent.error(screen.getByRole("img", { name: "shot.png" }));
    await waitFor(() => {
      expect(screen.getByRole("img", { name: "shot.png" })).toHaveAttribute(
        "src",
        "https://files.example/fresh",
      );
    });

    fireEvent.error(screen.getByRole("img", { name: "shot.png" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/expired/i);
    expect(getDownloadUrl).toHaveBeenCalledTimes(1);
  });

  it("fetches a download url on click and does not reuse it", async () => {
    const getDownloadUrl = vi
      .fn()
      .mockResolvedValueOnce("https://files.example/one")
      .mockResolvedValueOnce("https://files.example/two");
    const click = vi.fn();
    const originalCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      const element = originalCreate(tagName);
      if (tagName === "a") element.click = click;
      return element;
    });

    render(
      <DocumentPreviewModal
        isOpen
        onClose={vi.fn()}
        getDownloadUrl={getDownloadUrl}
        document={{
          id: "doc-9",
          name: "papers.pdf",
          mimeType: "application/pdf",
          url: "https://files.example/preview",
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    fireEvent.click(screen.getByRole("button", { name: "Download" }));

    await waitFor(() => expect(getDownloadUrl).toHaveBeenCalledTimes(2));
    expect(click).toHaveBeenCalledTimes(2);
  });
});
