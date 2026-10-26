import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { server } from "../../../mocks/server";
import { clearAllDrafts } from "../draftStore";
import { clearOutbox } from "../hooks/useSendMessage";
import { messageKeys } from "../hooks/useMessages";
import type { MessagesCache } from "../messageCache";
import { MessageComposer } from "../components/MessageComposer";
import { createWrapper, file, msg, signIn } from "./testUtils";

function renderComposer(conversationId = "c1") {
  const { queryClient, wrapper } = createWrapper();
  for (const id of ["c1", "c2"]) {
    queryClient.setQueryData<MessagesCache>(messageKeys.thread(id), {
      pages: [{ data: [msg({ conversationId: id })] }],
      pageParams: [undefined],
    });
  }
  const view = render(<MessageComposer conversationId={conversationId} />, { wrapper });
  return {
    queryClient,
    ...view,
    switchTo: (id: string) => view.rerender(<MessageComposer conversationId={id} />),
  };
}

function captureSends() {
  const bodies: Array<{ body: string; clientId: string }> = [];
  server.use(
    http.post("*/api/conversations/:id/messages", async ({ request }) => {
      const json = (await request.json()) as { body: string; clientId: string };
      bodies.push(json);
      return HttpResponse.json(msg({ id: `srv-${bodies.length}`, body: json.body, clientId: json.clientId }), { status: 201 });
    }),
  );
  return bodies;
}

describe("MessageComposer", () => {
  beforeEach(() => {
    signIn();
    clearAllDrafts();
    clearOutbox();
  });

  it("disables Send when the message is empty or whitespace", async () => {
    const user = userEvent.setup();
    renderComposer();
    const send = screen.getByRole("button", { name: "Send message" });
    expect(send).toBeDisabled();

    await user.type(screen.getByLabelText("Message"), "   ");
    expect(send).toBeDisabled();

    await user.type(screen.getByLabelText("Message"), "hi");
    expect(send).toBeEnabled();
  });

  it("Enter sends and clears the box", async () => {
    const bodies = captureSends();
    const user = userEvent.setup();
    renderComposer();
    const box = screen.getByLabelText("Message");

    await user.type(box, "hello there{Enter}");

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0].body).toBe("hello there");
    expect(box).toHaveValue("");
  });

  it("Shift+Enter inserts a newline and does not send", async () => {
    const bodies = captureSends();
    const user = userEvent.setup();
    renderComposer();
    const box = screen.getByLabelText("Message");

    await user.type(box, "line one{Shift>}{Enter}{/Shift}line two");

    expect(box).toHaveValue("line one\nline two");
    expect(bodies).toHaveLength(0);
  });

  it("does not send an empty message with Enter", async () => {
    const bodies = captureSends();
    const user = userEvent.setup();
    renderComposer();
    await user.type(screen.getByLabelText("Message"), "{Enter}");
    expect(bodies).toHaveLength(0);
  });

  it("keeps a draft per conversation across switching threads", async () => {
    const user = userEvent.setup();
    const { switchTo } = renderComposer("c1");

    await user.type(screen.getByLabelText("Message"), "draft for one");
    switchTo("c2");
    expect(screen.getByLabelText("Message")).toHaveValue("");

    await user.type(screen.getByLabelText("Message"), "draft for two");
    switchTo("c1");
    expect(screen.getByLabelText("Message")).toHaveValue("draft for one");
    switchTo("c2");
    expect(screen.getByLabelText("Message")).toHaveValue("draft for two");
  });

  it("clears the stored draft once the message is sent", async () => {
    captureSends();
    const user = userEvent.setup();
    const { switchTo } = renderComposer("c1");
    await user.type(screen.getByLabelText("Message"), "sent one{Enter}");
    switchTo("c2");
    switchTo("c1");
    expect(screen.getByLabelText("Message")).toHaveValue("");
  });

  describe("attachments", () => {
    it("rejects the wrong type with specific copy", async () => {
      const user = userEvent.setup({ applyAccept: false });
      renderComposer();
      await user.upload(screen.getByTestId("attachment-input"), file("cv.docx", "application/msword"));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        '"cv.docx" is a .docx file. Only images (JPG, PNG, WebP, GIF) and PDFs can be attached.',
      );
      expect(screen.queryByLabelText("Attachments to send")).not.toBeInTheDocument();
    });

    it("rejects oversized files with specific copy", async () => {
      const user = userEvent.setup({ applyAccept: false });
      renderComposer();
      await user.upload(screen.getByTestId("attachment-input"), file("huge.png", "image/png", 6 * 1024 * 1024));
      expect(await screen.findByRole("alert")).toHaveTextContent('"huge.png" is 6.0 MB. Each attachment must be 5.0 MB or smaller.');
    });

    it("shows chips, lets you remove one, and caps at 3", async () => {
      const user = userEvent.setup({ applyAccept: false });
      renderComposer();
      const input = screen.getByTestId("attachment-input");

      await user.upload(input, [file("a.png", "image/png"), file("b.pdf", "application/pdf")]);
      expect(screen.getByText("a.png")).toBeInTheDocument();
      expect(screen.getByText("b.pdf")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Remove a.png" }));
      expect(screen.queryByText("a.png")).not.toBeInTheDocument();

      await user.upload(input, [file("c.png", "image/png"), file("d.png", "image/png"), file("e.png", "image/png")]);
      expect(await screen.findByRole("alert")).toHaveTextContent('You can attach up to 3 files per message. "e.png" was not added.');
      expect(within(screen.getByLabelText("Attachments to send")).getAllByRole("listitem")).toHaveLength(3);
      expect(screen.getByRole("button", { name: "Attach files" })).toBeDisabled();
    });

    it("enables Send for attachments alone", async () => {
      const user = userEvent.setup({ applyAccept: false });
      renderComposer();
      await user.upload(screen.getByTestId("attachment-input"), file("only.pdf", "application/pdf"));
      expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled();
    });
  });
});
