import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { notificationRouter } from "../lib/notificationRouter";
import type { Notification } from "../types/notifications";

async function fetchNotification(id: string): Promise<Notification> {
  const res = await fetch(`/api/notifications/${id}`);
  if (!res.ok) {
    const err = Object.assign(new Error(`Failed to fetch notification: ${res.status}`), { status: res.status });
    throw err;
  }
  return res.json() as Promise<Notification>;
}

async function markRead(id: string): Promise<void> {
  await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
}

export function useNotificationDeepLink() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const notificationId = params.get("notificationId");
    if (!notificationId) return;

    // Remove the param from the URL immediately
    params.delete("notificationId");
    const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
    window.history.replaceState(null, "", newUrl);

    fetchNotification(notificationId)
      .then((notification) => {
        markRead(notificationId).catch(() => {});
        navigate(notificationRouter(notification), { replace: true });
      })
      .catch((err: { status?: number }) => {
        if (err?.status === 404) {
          console.warn(`Notification ${notificationId} not found, ignoring deep-link.`);
        } else {
          console.error("Failed to handle notification deep-link:", err);
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
