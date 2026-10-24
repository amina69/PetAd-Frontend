import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { messageService } from "../api/messageService";
import { decrementUnread, markMessagesRead, unreadAmong, type MessagesCache } from "../messageCache";
import type { Conversation } from "../types/message";
import { messageKeys } from "./useMessages";

/** How long a message must stay on screen before it counts as read. */
export const READ_DELAY_MS = 1000;
const VISIBLE_RATIO = 0.6;

/** True only while the user could actually be looking at the page. */
export function isTabActive(): boolean {
  return document.visibilityState === "visible" && document.hasFocus();
}

/**
 * Marks incoming messages read once they've been continuously visible for
 * ~1 s while the tab is visible AND focused.
 *
 * `observe(el)` is a ref callback for each unread incoming message element
 * (it must carry `data-message-id`). A hidden or blurred tab pauses the timers
 * and they restart when the tab becomes active again, so nothing is marked
 * read behind the user's back.
 */
export function useMarkMessagesRead(conversationId: string) {
  const queryClient = useQueryClient();
  const threadKey = messageKeys.thread(conversationId);

  const markMutation = useMutation<void, Error, string[]>({
    mutationFn: (ids) => messageService.markRead(conversationId, ids),
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: threadKey });
      void queryClient.invalidateQueries({ queryKey: messageKeys.conversations });
    },
  });
  const mutateRef = useRef(markMutation.mutate);
  useEffect(() => {
    mutateRef.current = markMutation.mutate;
  });

  const markRead = useCallback(
    (ids: string[]) => {
      const cached = queryClient.getQueryData<MessagesCache>(threadKey);
      const unread = unreadAmong(cached, ids);
      if (unread.length === 0) return;

      queryClient.setQueryData<MessagesCache>(threadKey, (data) =>
        markMessagesRead(data, unread, new Date().toISOString()),
      );
      queryClient.setQueryData<Conversation[]>(messageKeys.conversations, (list) =>
        decrementUnread(list, conversationId, unread.length),
      );
      mutateRef.current(unread);
    },
    [conversationId, queryClient, threadKey],
  );

  const visible = useRef(new Set<string>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const requested = useRef(new Set<string>());
  const observer = useRef<IntersectionObserver | null>(null);

  const stopTimer = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const startTimer = useCallback(
    (id: string) => {
      if (timers.current.has(id) || requested.current.has(id) || !isTabActive()) return;
      timers.current.set(
        id,
        setTimeout(() => {
          timers.current.delete(id);
          // Re-check at fire time: the tab may have been hidden mid-delay.
          if (!visible.current.has(id) || !isTabActive()) return;
          requested.current.add(id);
          markRead([id]);
        }, READ_DELAY_MS),
      );
    },
    [markRead],
  );

  // Pause on hide/blur, resume on show/focus.
  useEffect(() => {
    const sync = () => {
      if (isTabActive()) visible.current.forEach(startTimer);
      else {
        timers.current.forEach((timer) => clearTimeout(timer));
        timers.current.clear();
      }
    };
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    window.addEventListener("blur", sync);
    const pending = timers.current;
    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener("blur", sync);
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, [startTimer]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.messageId;
          if (!id) continue;
          if (entry.isIntersecting && entry.intersectionRatio >= VISIBLE_RATIO) {
            visible.current.add(id);
            startTimer(id);
          } else {
            visible.current.delete(id);
            stopTimer(id);
          }
        }
      },
      { threshold: [0, VISIBLE_RATIO, 1] },
    );
    observer.current = io;
    const seen = visible.current;
    return () => {
      io.disconnect();
      observer.current = null;
      seen.clear();
    };
  }, [startTimer, stopTimer]);

  const observe = useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;
      const io = observer.current;
      io?.observe(element);
      return () => {
        io?.unobserve(element);
        const id = element.dataset.messageId;
        if (id) {
          visible.current.delete(id);
          stopTimer(id);
        }
      };
    },
    [stopTimer],
  );

  return { observe };
}
