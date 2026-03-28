import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "./api-client";
import { notificationRouter } from "./notificationRouter";
import { NotFoundError } from "./api-errors";
import type { Notification } from "../types/notifications";

export function NotificationDeepLinkHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const notificationId = params.get("notificationId")?.trim();

    if (!notificationId) {
      return;
    }

    const removeNotificationId = () => {
      params.delete("notificationId");
      const search = params.toString();
      const nextUrl = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;
      window.history.replaceState(null, "", nextUrl);
    };

    const handleDeepLink = async () => {
      let notification: Notification;

      try {
        notification = await apiClient.get<Notification>(`/notifications/${notificationId}`);
      } catch (error) {
        if (error instanceof NotFoundError) {
          console.warn(`Notification deep-link not found: ${notificationId}`);
          removeNotificationId();
          return;
        }

        throw error;
      }

      try {
        await apiClient.patch(`/notifications/${notificationId}/read`);
      } catch (error) {
        console.warn(`Failed to mark notification ${notificationId} as read`, error);
      }

      removeNotificationId();
      navigate(notificationRouter(notification), { replace: true });
    };

    handleDeepLink();
  }, [navigate]);

  return null;
}
