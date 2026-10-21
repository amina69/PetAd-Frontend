import type { Notification } from "../../types/notifications";

export function buildNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: "notif-001",
    type: "ESCROW_FUNDED",
    title: "Escrow Funded",
    message: "The escrow for adoption #adoption-001 has been funded and is ready.",
    time: "2026-06-01T10:00:00.000Z",
    isRead: false,
    hasArrow: true,
    metadata: { resourceId: "adoption-001" },
    ...overrides,
  };
}
