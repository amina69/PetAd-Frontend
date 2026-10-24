import { Fragment, useCallback, useLayoutEffect, useMemo, useRef, useState, type UIEvent } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { ArrowDown } from "lucide-react";
import { useMessagingUser } from "../hooks/useMessagingUser";
import { flattenMessages } from "../messageCache";
import { useMarkMessagesRead } from "../hooks/useMarkMessagesRead";
import { useMessages } from "../hooks/useMessages";
import { useSendMessage } from "../hooks/useSendMessage";
import type { Message } from "../types/message";
import { MessageBubble } from "./MessageBubble";

/** Within this many px of the bottom counts as "reading the latest". */
const NEAR_BOTTOM_PX = 80;
/** Scrolling within this many px of the top loads older messages. */
const LOAD_OLDER_PX = 60;

interface MessageThreadProps {
  conversationId: string;
  /** Sizing/layout for the scroll container; it must have a bounded height. */
  className?: string;
}

function dayKey(message: Message): string {
  return format(parseISO(message.createdAt), "yyyy-MM-dd");
}

function dayLabel(message: Message): string {
  const date = parseISO(message.createdAt);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, d MMM yyyy");
}

interface Anchor {
  /** Message that was first (topmost) before older pages were prepended. */
  messageId: string;
  /** Its distance from the container's visible top edge. */
  offset: number;
}

/**
 * Chat thread. Newest message at the bottom, older ones load as you scroll up.
 *
 * - Loading older messages keeps the viewport still: we remember which message
 *   was at the top (and how far from the edge) and re-pin it after the prepend.
 * - New messages only pull the view to the bottom when you were already near
 *   it (or sent the message). Otherwise a "New messages" button appears.
 * - Messages are grouped by day; bubbles align by `senderId` vs the current user.
 */
export function MessageThread({ conversationId, className = "h-full" }: MessageThreadProps) {
  // Remount per conversation so scroll bookkeeping starts fresh.
  return <ThreadInner key={conversationId} conversationId={conversationId} className={className} />;
}

function ThreadInner({ conversationId, className }: Required<MessageThreadProps>) {
  const user = useMessagingUser();
  const query = useMessages(conversationId);
  const { retry, remove } = useSendMessage(conversationId);
  const { observe } = useMarkMessagesRead(conversationId);
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = query;

  const messages = useMemo(() => flattenMessages(query.data), [query.data]);

  const containerRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const anchor = useRef<Anchor | null>(null);
  const prev = useRef<{ first?: string; last?: string }>({});
  const [unseen, setUnseen] = useState(0);

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    nearBottom.current = true;
    setUnseen(0);
  }, []);

  const loadOlder = useCallback(() => {
    const el = containerRef.current;
    if (!el || !hasNextPage || isFetchingNextPage || messages.length === 0) return;

    const first = el.querySelector<HTMLElement>(`[data-message-id="${CSS.escape(messages[0].id)}"]`);
    if (first) anchor.current = { messageId: messages[0].id, offset: first.offsetTop - el.scrollTop };
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, messages]);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    if (nearBottom.current) setUnseen(0);
    if (el.scrollTop < LOAD_OLDER_PX) loadOlder();
  };

  // Runs after every change to the message list, before paint.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || messages.length === 0) return;

    const first = messages[0].id;
    const last = messages[messages.length - 1];
    const before = prev.current;
    prev.current = { first, last: last.id };

    if (before.last === undefined) {
      scrollToBottom(); // first paint of this thread
      return;
    }

    if (anchor.current && first !== anchor.current.messageId) {
      // Older messages were prepended: re-pin the previous top message.
      const target = el.querySelector<HTMLElement>(`[data-message-id="${CSS.escape(anchor.current.messageId)}"]`);
      if (target) el.scrollTop = target.offsetTop - anchor.current.offset;
      anchor.current = null;
      return;
    }

    if (last.id !== before.last) {
      const mine = last.senderId === user?.id;
      if (mine || nearBottom.current) scrollToBottom();
      else setUnseen((count) => count + 1);
    }
  }, [messages, scrollToBottom, user?.id]);

  // A page shorter than the viewport can't be scrolled, so keep loading.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || el.clientHeight === 0) return;
    if (el.scrollHeight <= el.clientHeight) loadOlder();
  }, [messages, loadOlder]);

  // The anchor is only meaningful for the fetch that created it.
  useLayoutEffect(() => {
    if (!isFetchingNextPage) anchor.current = null;
  }, [isFetchingNextPage]);

  if (query.isPending) {
    return (
      <div className={`${className} flex items-center justify-center text-sm text-gray-500`} role="status">
        Loading messages…
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className={`${className} flex flex-col items-center justify-center gap-2 text-sm`} role="alert">
        <p className="text-red-600">Couldn't load messages.</p>
        <button type="button" onClick={() => void query.refetch()} className="font-medium text-[#E84D2A] hover:underline">
          Try again
        </button>
      </div>
    );
  }

  let lastDay = "";

  return (
    <div className={`${className} relative`}>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        data-testid="message-scroll"
        role="log"
        aria-label="Messages"
        aria-live="polite"
        className="relative h-full space-y-3 overflow-y-auto px-4 py-3"
      >
        {hasNextPage && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={loadOlder}
              disabled={isFetchingNextPage}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-60"
            >
              {isFetchingNextPage ? "Loading older messages…" : "Load older messages"}
            </button>
          </div>
        )}

        {messages.length === 0 && <p className="py-8 text-center text-sm text-gray-500">No messages yet. Say hello!</p>}

        {messages.map((message) => {
          const key = dayKey(message);
          const showDay = key !== lastDay;
          lastDay = key;
          const isOwn = message.senderId === user?.id;
          const unreadIncoming = !isOwn && !message.readAt && message.status !== "sending";

          return (
            <Fragment key={message.clientId ?? message.id}>
              {showDay && (
                <div className="flex justify-center" data-testid="day-separator">
                  <span className="rounded-full bg-gray-100 px-3 py-0.5 text-[11px] font-medium text-gray-500">
                    {dayLabel(message)}
                  </span>
                </div>
              )}
              <MessageBubble
                message={message}
                isOwn={isOwn}
                observeRef={unreadIncoming ? observe : undefined}
                onRetry={retry}
                onDelete={remove}
              />
            </Fragment>
          );
        })}
      </div>

      {unseen > 0 && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-[#0D162B] px-3 py-1.5 text-xs font-medium text-white shadow-lg"
        >
          <ArrowDown size={14} aria-hidden="true" />
          {unseen === 1 ? "1 new message" : `${unseen} new messages`}
        </button>
      )}
    </div>
  );
}
