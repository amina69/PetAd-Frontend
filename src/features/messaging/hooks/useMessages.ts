import { useInfiniteQuery, useQuery, type InfiniteData } from "@tanstack/react-query";
import { messageService } from "../api/messageService";
import type { Conversation, MessagesPage } from "../types/message";

export const messageKeys = {
  all: ["messages"] as const,
  thread: (conversationId: string) => ["messages", conversationId] as const,
  conversations: ["conversations"] as const,
};

/**
 * Message thread as an infinite query. Page 0 is the newest page; fetching the
 * next page loads OLDER messages (scroll up). Use `flattenMessages(data)` for
 * the chronological list.
 */
export function useMessages(conversationId: string) {
  return useInfiniteQuery<
    MessagesPage,
    Error,
    InfiniteData<MessagesPage, string | undefined>,
    ReturnType<typeof messageKeys.thread>,
    string | undefined
  >({
    queryKey: messageKeys.thread(conversationId),
    queryFn: ({ pageParam }) => messageService.getMessages(conversationId, pageParam),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(conversationId),
    // The socket keeps the thread live and reconnects backfill it, so avoid
    // refetching every loaded page on focus.
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useConversations() {
  return useQuery<Conversation[], Error>({
    queryKey: messageKeys.conversations,
    queryFn: () => messageService.listConversations(),
    // Unread badges are patched live by the socket.
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
