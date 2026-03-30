import { useApiMutation } from "./useApiMutation";
import { useQueryClient } from "@tanstack/react-query";
import type { NotificationsPage } from "../types/notifications";

type NotificationCache = {
  pages: NotificationsPage[];
  pageParams: (string | undefined)[];
};

async function markAllNotificationsRead(): Promise<void> {
  const res = await fetch("/api/notifications/read-all", { method: "POST" });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to mark all notifications read: ${res.status}`);
  }
}

export function useMutateMarkAllRead() {
  const queryClient = useQueryClient();

  const { mutate, isPending, isError } = useApiMutation<void, void>(
    () => markAllNotificationsRead(),
    {
      invalidates: [["notifications"]],
      onOptimisticUpdate: () => {
        queryClient.setQueriesData<NotificationCache>(
          { queryKey: ["notifications"] },
          (old) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                data: page.data.map((n) => ({ ...n, isRead: true })),
              })),
            };
          },
        );

        queryClient.setQueryData<NotificationsPage>(
          ["notifications", "dropdown"],
          (old) => {
            if (!old) return old;
            return {
              ...old,
              data: old.data.map((n) => ({ ...n, isRead: true })),
            };
          },
        );
      },
    },
  );

  return {
    markAllRead: () => mutate(),
    isPending,
    isError,
  };
}