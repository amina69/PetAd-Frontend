import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { messageService } from "../../../api/messageService";

export const conversationKeys = {
  all: ["conversations"] as const,
  messages: (id: string) => ["conversation-messages", id] as const,
};

export function useConversations() {
  return useQuery({
    queryKey: conversationKeys.all,
    queryFn: () => messageService.getConversations(),
    select: (conversations) =>
      [...conversations].sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() -
          new Date(left.updatedAt).getTime(),
      ),
  });
}

export function useConversationMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: conversationKeys.messages(conversationId),
    queryFn: ({ pageParam }) =>
      messageService.getConversationMessages(
        conversationId,
        typeof pageParam === "string" ? pageParam : undefined,
      ),
    enabled: Boolean(conversationId),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
