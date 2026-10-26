import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MessageThread } from "../components/MessageThread";
import { messageKeys } from "../hooks/useMessages";
import { READ_DELAY_MS } from "../hooks/useMarkMessagesRead";
import { clearOutbox } from "../hooks/useSendMessage";
import { flattenMessages, type MessagesCache } from "../messageCache";
import type { Conversation } from "../types/message";
import { createWrapper, msg, signIn } from "./testUtils";

/** Minimal IntersectionObserver double: tests decide when elements are visible. */
class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  observed = new Set<Element>();
  private callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }
  observe = (el: Element) => void this.observed.add(el);
  unobserve = (el: Element) => void this.observed.delete(el);
  disconnect = () => this.observed.clear();
  takeRecords = () => [];
  trigger(el: Element, isIntersecting: boolean, ratio = isIntersecting ? 1 : 0) {
    this.callback(
      [{ target: el, isIntersecting, intersectionRatio: ratio } as unknown as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

function setVisibility(state: "visible" | "hidden", focused = state === "visible") {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
  vi.spyOn(document, "hasFocus").mockReturnValue(focused);
  document.dispatchEvent(new Event("visibilitychange"));
}

function renderThread() {
  const ctx = createWrapper();
  const incoming = msg({ id: "in-1", conversationId: "c1" });
  ctx.queryClient.setQueryData<MessagesCache>(messageKeys.thread("c1"), {
    pages: [{ data: [incoming] }],
    pageParams: [undefined],
  });
  ctx.queryClient.setQueryData<Conversation[]>(messageKeys.conversations, [
    { id: "c1", title: "One", unreadCount: 1, updatedAt: "2026-01-01T00:00:00.000Z" },
  ]);
  render(<MessageThread conversationId="c1" />, { wrapper: ctx.wrapper });

  const el = screen.getByTestId("message");
  const io = FakeIntersectionObserver.instances.at(-1)!;
  const readAt = () => flattenMessages(ctx.queryClient.getQueryData<MessagesCache>(messageKeys.thread("c1")))[0].readAt;
  const unread = () => ctx.queryClient.getQueryData<Conversation[]>(messageKeys.conversations)![0].unreadCount;
  return { ...ctx, el, io, readAt, unread };
}

describe("read receipts", () => {
  beforeEach(() => {
    signIn();
    clearOutbox();
    FakeIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    vi.useFakeTimers();
    setVisibility("visible");
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    // @ts-expect-error restore jsdom default
    delete document.visibilityState;
  });

  it("marks a message read after it has been visible for ~1s", () => {
    const { el, io, readAt, unread } = renderThread();
    act(() => io.trigger(el, true));

    act(() => void vi.advanceTimersByTime(READ_DELAY_MS - 1));
    expect(readAt()).toBeNull();

    act(() => void vi.advanceTimersByTime(1));
    expect(readAt()).toBeTruthy();
    expect(unread()).toBe(0);
  });

  it("does NOT mark read while the tab is hidden", () => {
    setVisibility("hidden");
    const { el, io, readAt } = renderThread();
    act(() => io.trigger(el, true));
    act(() => void vi.advanceTimersByTime(10_000));
    expect(readAt()).toBeNull();
  });

  it("does NOT mark read while the window is unfocused", () => {
    setVisibility("visible", false);
    const { el, io, readAt } = renderThread();
    act(() => io.trigger(el, true));
    act(() => void vi.advanceTimersByTime(10_000));
    expect(readAt()).toBeNull();
  });

  it("starts counting once the hidden tab becomes active again", () => {
    setVisibility("hidden");
    const { el, io, readAt } = renderThread();
    act(() => io.trigger(el, true));
    act(() => void vi.advanceTimersByTime(5_000));
    expect(readAt()).toBeNull();

    act(() => setVisibility("visible"));
    act(() => void vi.advanceTimersByTime(READ_DELAY_MS));
    expect(readAt()).toBeTruthy();
  });

  it("cancels if the tab is hidden mid-delay", () => {
    const { el, io, readAt } = renderThread();
    act(() => io.trigger(el, true));
    act(() => void vi.advanceTimersByTime(500));

    act(() => setVisibility("hidden"));
    act(() => void vi.advanceTimersByTime(5_000));
    expect(readAt()).toBeNull();
  });

  it("cancels if the message scrolls out of view before the delay", () => {
    const { el, io, readAt } = renderThread();
    act(() => io.trigger(el, true));
    act(() => void vi.advanceTimersByTime(600));
    act(() => io.trigger(el, false));
    act(() => void vi.advanceTimersByTime(5_000));
    expect(readAt()).toBeNull();
  });

  it("ignores messages that are only barely in view", () => {
    const { el, io, readAt } = renderThread();
    act(() => io.trigger(el, true, 0.2));
    act(() => void vi.advanceTimersByTime(5_000));
    expect(readAt()).toBeNull();
  });

  it("only observes unread incoming messages", () => {
    const ctx = createWrapper();
    ctx.queryClient.setQueryData<MessagesCache>(messageKeys.thread("c1"), {
      pages: [{ data: [msg({ readAt: "2026-01-01T00:00:00Z" }), msg({ senderId: "user-me" })] }],
      pageParams: [undefined],
    });
    render(<MessageThread conversationId="c1" />, { wrapper: ctx.wrapper });
    expect(FakeIntersectionObserver.instances.at(-1)!.observed.size).toBe(0);
  });
});
