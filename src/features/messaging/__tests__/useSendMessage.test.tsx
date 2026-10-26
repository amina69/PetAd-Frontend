import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { server } from "../../../mocks/server";
import { resetMessagesMock } from "../../../mocks/handlers/messages";
import { flattenMessages, type MessagesCache } from "../messageCache";
import { clearOutbox, useSendMessage } from "../hooks/useSendMessage";
import { messageKeys } from "../hooks/useMessages";
import { createWrapper, file, msg, signIn } from "./testUtils";

function setup() {
  const { queryClient, wrapper } = createWrapper();
  queryClient.setQueryData<MessagesCache>(messageKeys.thread("conv-1"), {
    pages: [{ data: [msg({ conversationId: "conv-1" })] }],
    pageParams: [undefined],
  });
  const hook = renderHook(() => useSendMessage("conv-1"), { wrapper });
  const thread = () => flattenMessages(queryClient.getQueryData<MessagesCache>(messageKeys.thread("conv-1")));
  return { ...hook, queryClient, thread };
}

describe("useSendMessage", () => {
  beforeEach(() => {
    signIn();
    clearOutbox();
    resetMessagesMock();
  });

  it("shows the message instantly as `sending`, then flips to `sent`", async () => {
    const { result, thread } = setup();

    act(() => {
      result.current.send({ body: "hello" });
    });

    // Instant: temp message present before the network resolves.
    expect(thread().at(-1)).toMatchObject({ body: "hello", status: "sending", senderId: "user-me" });

    await waitFor(() => expect(thread().at(-1)?.status).toBe("sent"));
    expect(thread().filter((m) => m.body === "hello")).toHaveLength(1);
    expect(thread().at(-1)!.id).not.toMatch(/^tmp-/);
  });

  it("flips to `failed` on error, and Retry succeeds without duplicating", async () => {
    let attempts = 0;
    const seenClientIds: string[] = [];
    server.use(
      http.post("*/api/conversations/:id/messages", async ({ request }) => {
        const body = (await request.json()) as { clientId: string; body: string };
        seenClientIds.push(body.clientId);
        attempts += 1;
        if (attempts === 1) return HttpResponse.json({ message: "boom" }, { status: 500 });
        return HttpResponse.json(
          msg({ id: "srv-1", conversationId: "conv-1", senderId: "user-me", body: body.body, clientId: body.clientId }),
          { status: 201 },
        );
      }),
    );
    const { result, thread } = setup();

    let clientId = "";
    act(() => {
      clientId = result.current.send({ body: "flaky" });
    });
    await waitFor(() => expect(thread().at(-1)?.status).toBe("failed"));

    act(() => result.current.retry(clientId));
    expect(thread().at(-1)?.status).toBe("sending"); // same bubble, not a second one

    await waitFor(() => expect(thread().at(-1)?.status).toBe("sent"));
    expect(thread().filter((m) => m.body === "flaky")).toHaveLength(1);
    expect(thread().at(-1)!.id).toBe("srv-1");
    // Both attempts used the same idempotency key.
    expect(new Set(seenClientIds).size).toBe(1);
  });

  it("does not duplicate when the socket echo arrives before the HTTP response", async () => {
    const { result, queryClient, thread } = setup();
    server.use(
      http.post("*/api/conversations/:id/messages", async ({ request }) => {
        const { clientId } = (await request.json()) as { clientId: string };
        // Echo lands in the cache first (socket), carrying the clientId.
        queryClient.setQueryData<MessagesCache>(messageKeys.thread("conv-1"), (data) => ({
          ...data!,
          pages: [
            {
              data: [
                ...data!.pages[0].data.filter((m) => m.clientId !== clientId),
                msg({ id: "srv-2", conversationId: "conv-1", senderId: "user-me", body: "raced", clientId }),
              ],
            },
          ],
        }));
        return HttpResponse.json(
          msg({ id: "srv-2", conversationId: "conv-1", senderId: "user-me", body: "raced", clientId }),
          { status: 201 },
        );
      }),
    );

    act(() => {
      result.current.send({ body: "raced" });
    });
    await waitFor(() => expect(thread().at(-1)?.status).toBe("sent"));
    expect(thread().filter((m) => m.body === "raced")).toHaveLength(1);
  });

  it("remove() discards a failed message", async () => {
    server.use(http.post("*/api/conversations/:id/messages", () => HttpResponse.json({}, { status: 500 })));
    const { result, thread } = setup();

    let clientId = "";
    act(() => {
      clientId = result.current.send({ body: "nope" });
    });
    await waitFor(() => expect(thread().at(-1)?.status).toBe("failed"));

    act(() => result.current.remove(clientId));
    expect(thread().some((m) => m.body === "nope")).toBe(false);
    // Retrying a discarded message is a no-op.
    act(() => result.current.retry(clientId));
    expect(thread().some((m) => m.body === "nope")).toBe(false);
  });

  it("sends attachments as multipart and renders them optimistically", async () => {
    let contentType = "";
    server.use(
      // jsdom's File can't be re-parsed by undici, so assert on the header only.
      http.post("*/api/conversations/:id/messages", ({ request }) => {
        contentType = request.headers.get("Content-Type") ?? "";
        return HttpResponse.json(msg({ id: "srv-9", conversationId: "conv-1", senderId: "user-me", body: "see attached" }), {
          status: 201,
        });
      }),
    );
    const { result, thread } = setup();
    act(() => {
      result.current.send({ body: "see attached", files: [file("pic.png", "image/png"), file("doc.pdf", "application/pdf")] });
    });
    expect(thread().at(-1)!.attachments.map((a) => a.fileName)).toEqual(["pic.png", "doc.pdf"]);

    await waitFor(() => expect(thread().at(-1)?.status).toBe("sent"));
    // Browser-set boundary: we must not force a JSON content type.
    expect(contentType).toMatch(/^multipart\/form-data; boundary=/);
  });
});
