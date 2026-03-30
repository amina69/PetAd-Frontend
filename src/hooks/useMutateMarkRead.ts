import { useApiMutation } from "./useApiMutation";
import { useQueryClient } from "@tanstack/react-query";
import type { NotificationsPage } from "../types/notifications";

type NotificationCache = {
  pages: NotificationsPage[];
  pageParams: (string | undefined)[];
};

async function markNotificationRead(id: string | number): Promise<void> {
  const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to mark notification read: ${res.status}`);
  }
}

export function useMutateMarkRead() {
  const queryClient = useQueryClient();

  const { mutate, isPending, isError } = useApiMutation<void, string | number>(
    (id) => markNotificationRead(id),
    {
      invalidates: [["notifications"]],
      onOptimisticUpdate: (id) => {
        queryClient.setQueriesData<NotificationCache>(
          { queryKey: ["notifications"] },
          (old) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                data: page.data.map((n) =>
                  String(n.id) === String(id) ? { ...n, isRead: true } : n,
                ),
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
              data: old.data.map((n) =>
                String(n.id) === String(id) ? { ...n, isRead: true } : n,
              ),
            };
          },
        );
      },
    },
  );

  return {
    markRead: (id: string | number) => mutate(id),
    isPending,
    isError,
  };
}