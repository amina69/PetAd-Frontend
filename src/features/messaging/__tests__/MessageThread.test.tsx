import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "../../../mocks/server";
import { resetMessagesMock } from "../../../mocks/handlers/messages";
import { MessageThread } from "../components/MessageThread";
import { messageKeys } from "../hooks/useMessages";
import { clearOutbox } from "../hooks/useSendMessage";
import { flattenMessages, upsertMessage, type MessagesCache } from "../messageCache";
import { installFakeLayout, ROW, VIEWPORT } from "./fakeLayout";
import { createWrapper, ME, msg, signIn } from "./testUtils";

let restoreLayout: () => void;
beforeEach(() => {
  signIn();
  clearOutbox();
  resetMessagesMock();
  restoreLayout = installFakeLayout();
});
afterEach(() => restoreLayout());

function seed(messages: ReturnType<typeof msg>[], conversationId = "c1") {
  const ctx = createWrapper();
  ctx.queryClient.setQueryData<MessagesCache>(messageKeys.thread(conversationId), {
    pages: [{ data: messages }],
    pageParams: [undefined],
  });
  render(<MessageThread conversationId={conversationId} className="h-full" />, { wrapper: ctx.wrapper });
  return ctx;
}

const scroller = () => screen.getByTestId("message-scroll");

describe("MessageThread — layout & rendering", () => {
  it("groups messages by day with separators", () => {
    seed([
      msg({ createdAt: new Date(2026, 0, 10, 9, 0).toISOString() }),
      msg({ createdAt: new Date(2026, 0, 10, 18, 0).toISOString() }),
      msg({ createdAt: new Date(2026, 0, 11, 8, 0).toISOString() }),
    ]);
    const separators = screen.getAllByTestId("day-separator");
    expect(separators).toHaveLength(2);
    expect(separators[0]).toHaveTextContent("Saturday, 10 Jan 2026");
    expect(separators[1]).toHaveTextContent("Sunday, 11 Jan 2026");
  });

  it('labels the current day "Today"', () => {
    seed([msg({ createdAt: new Date().toISOString() })]);
    expect(screen.getByTestId("day-separator")).toHaveTextContent("Today");
  });

  it("aligns bubbles by senderId vs the current user", () => {
    seed([msg({ senderId: ME.id, body: "mine" }), msg({ senderId: "user-other", body: "theirs" })]);
    const [mine, theirs] = screen.getAllByTestId("message");
    expect(mine).toHaveClass("items-end");
    expect(theirs).toHaveClass("items-start");
    expect(within(theirs).getByText("Jane")).toBeInTheDocument(); // sender name only on incoming
  });

  it("starts scrolled to the newest message", () => {
    seed(Array.from({ length: 12 }, () => msg()));
    expect(scroller().scrollTop).toBe(scroller().scrollHeight);
  });

  it("shows an empty state", () => {
    seed([]);
    expect(screen.getByText(/No messages yet/)).toBeInTheDocument();
  });

  describe("attachments", () => {
    const image = { id: "a1", fileName: "buddy.png", mimeType: "image/png", size: 100, url: "data:image/png;base64,AAAA" };
    const pdf = { id: "a2", fileName: "vaccines.pdf", mimeType: "application/pdf", size: 2048 };

    it('gives images meaningful alt text ("Image sent by Jane")', () => {
      seed([msg({ senderName: "Jane", attachments: [image] })]);
      expect(screen.getByAltText("Image sent by Jane")).toHaveAttribute("src", image.url);
    });

    it('uses "you" for your own images', () => {
      seed([msg({ senderId: ME.id, senderName: "Me Myself", attachments: [image] })]);
      expect(screen.getByAltText("Image sent by you")).toBeInTheDocument();
    });

    it("opens a preview on click and closes it with Escape", async () => {
      const user = userEvent.setup();
      seed([msg({ senderName: "Jane", attachments: [image] })]);
      await user.click(screen.getByRole("button", { name: "Preview image buddy.png" }));

      const dialog = screen.getByRole("dialog", { name: "Image preview" });
      expect(within(dialog).getByAltText("Image sent by Jane")).toBeInTheDocument();

      await user.keyboard("{Escape}");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders non-images as file cards and downloads via a short-lived URL", async () => {
      const open = vi.spyOn(window, "open").mockReturnValue(null);
      const user = userEvent.setup();
      seed([msg({ id: "m-pdf", attachments: [pdf] })]);

      expect(screen.getByText("vaccines.pdf")).toBeInTheDocument();
      expect(screen.getByText("2.0 KB")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Download vaccines.pdf" }));
      await waitFor(() => expect(open).toHaveBeenCalledTimes(1));
      expect(open.mock.calls[0][0]).toMatch(/files\.example\.com\/m-pdf\/a2\?sig=short-lived/);
      open.mockRestore();
    });

    it("shows an error when the download link can't be fetched", async () => {
      server.use(http.get("*/api/messages/:m/attachments/:a/url", () => HttpResponse.json({}, { status: 500 })));
      const user = userEvent.setup();
      seed([msg({ attachments: [pdf] })]);
      await user.click(screen.getByRole("button", { name: "Download vaccines.pdf" }));
      expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't get the download link");
    });
  });

  describe("delivery state", () => {
    it('shows "Sending…" for in-flight messages', () => {
      seed([msg({ senderId: ME.id, status: "sending", clientId: "c-1", id: "tmp-c-1" })]);
      expect(screen.getByText("Sending…")).toBeInTheDocument();
    });

    it("shows Retry and Delete on failure; Delete removes the bubble", async () => {
      const user = userEvent.setup();
      seed([msg({ senderId: ME.id, status: "failed", clientId: "c-2", id: "tmp-c-2", body: "oops" })]);
      expect(screen.getByText("Failed to send")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Delete" }));
      expect(screen.queryByText("oops")).not.toBeInTheDocument();
    });
  });
});

describe("MessageThread — infinite scroll upward", () => {
  /** Renders the real mocked thread (conv-1: 55 messages, pages of 20). */
  async function renderServerThread() {
    const ctx = createWrapper();
    render(<MessageThread conversationId="conv-1" />, { wrapper: ctx.wrapper });
    await screen.findByRole("log");
    await waitFor(() => expect(screen.getAllByTestId("message").length).toBe(20));
    return ctx;
  }

  const bubbleIds = () => screen.getAllByTestId("message").map((el) => el.getAttribute("data-message-id")!);

  it("does not jump the viewport when older messages load (anchors on the previous first message)", async () => {
    await renderServerThread();
    const box = scroller();
    const firstBefore = bubbleIds()[0];
    const anchorEl = () => box.querySelector<HTMLElement>(`[data-message-id="${firstBefore}"]`)!;

    // User scrolls to the very top.
    act(() => {
      box.scrollTop = 0;
      fireEvent.scroll(box);
    });
    const offsetBefore = anchorEl().offsetTop - box.scrollTop;

    await waitFor(() => expect(screen.getAllByTestId("message").length).toBe(40));
    expect(bubbleIds()[0]).not.toBe(firstBefore); // older messages were prepended

    // The same message sits the same distance from the top edge: no jump.
    expect(anchorEl().offsetTop - box.scrollTop).toBe(offsetBefore);
    expect(box.scrollTop).toBeGreaterThan(0);
  });

  it("loads older pages until the history is exhausted, then offers no more", async () => {
    await renderServerThread();
    const box = scroller();
    for (const expected of [40, 55]) {
      act(() => {
        box.scrollTop = 0;
        fireEvent.scroll(box);
      });
      await waitFor(() => expect(screen.getAllByTestId("message").length).toBe(expected));
    }
    expect(screen.queryByRole("button", { name: /older messages/i })).not.toBeInTheDocument();
    expect(new Set(bubbleIds()).size).toBe(55); // no duplicates across pages
  });

  it("has a Load older button for keyboard users", async () => {
    const user = userEvent.setup();
    await renderServerThread();
    await user.click(screen.getByRole("button", { name: "Load older messages" }));
    await waitFor(() => expect(screen.getAllByTestId("message").length).toBe(40));
  });
});

describe("MessageThread — incoming messages", () => {
  function setup() {
    const ctx = seed(Array.from({ length: 10 }, () => msg()));
    // React Query notifies observers on a macrotask, so wait for the DOM to catch up.
    const receive = async (message: ReturnType<typeof msg>) => {
      await act(async () => {
        ctx.queryClient.setQueryData<MessagesCache>(messageKeys.thread("c1"), (d) => upsertMessage(d, message));
      });
      await waitFor(() => expect(document.querySelector(`[data-message-id="${message.id}"]`)).not.toBeNull());
    };
    return { ...ctx, receive };
  }
  const atBottom = () => scroller().scrollHeight - VIEWPORT;

  it("does NOT yank the user down while reading history", async () => {
    const { receive } = setup();
    const box = scroller();
    act(() => {
      box.scrollTop = 2 * ROW; // reading older messages
      fireEvent.scroll(box);
    });

    await receive(msg({ body: "new while reading" }));

    expect(box.scrollTop).toBe(2 * ROW); // unchanged
    expect(screen.getByRole("button", { name: "1 new message" })).toBeInTheDocument();
  });

  it("counts several unseen messages and the pill scrolls to the bottom", async () => {
    const user = userEvent.setup();
    const { receive } = setup();
    const box = scroller();
    act(() => {
      box.scrollTop = 0;
      fireEvent.scroll(box);
    });
    await receive(msg());
    await receive(msg());
    await user.click(screen.getByRole("button", { name: "2 new messages" }));

    expect(box.scrollTop).toBe(box.scrollHeight);
    expect(screen.queryByRole("button", { name: /new message/ })).not.toBeInTheDocument();
  });

  it("sticks to the bottom when the user was already near it", async () => {
    const { receive } = setup();
    const box = scroller();
    act(() => {
      box.scrollTop = atBottom() - 20; // within 80px of the bottom
      fireEvent.scroll(box);
    });

    await receive(msg());
    expect(box.scrollTop).toBe(box.scrollHeight);
    expect(screen.queryByRole("button", { name: /new message/ })).not.toBeInTheDocument();
  });

  it("always scrolls to the bottom for the user's own message", async () => {
    const { receive } = setup();
    const box = scroller();
    act(() => {
      box.scrollTop = 0;
      fireEvent.scroll(box);
    });
    await receive(msg({ senderId: ME.id, senderName: "Me" }));
    expect(box.scrollTop).toBe(box.scrollHeight);
  });

  it("renders a single bubble when the same message is delivered twice", async () => {
    const { receive, queryClient } = setup();
    const dup = msg({ body: "once" });
    await receive(dup);
    await receive({ ...dup });
    expect(screen.getAllByText("once")).toHaveLength(1);
    expect(flattenMessages(queryClient.getQueryData<MessagesCache>(messageKeys.thread("c1")))).toHaveLength(11);
  });
});
