import { apiClient } from "../lib/api-client";

/**
 * notificationService
 *
 * Real notification API calls via the api-client.
 */
export const notificationService = {
  /**
   * Mark a single notification as read.
   * PATCH /notifications/:id/read
   */
  async markAsRead(id: string | number): Promise<void> {
    return apiClient.patch(`/notifications/${id}/read`);
  },
};
