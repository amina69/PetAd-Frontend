import type { Notification } from "../types/notifications";

/**
 * Maps notification types to the correct application route.
 * 
 * @param notification The notification object containing type and metadata.
 * @returns The application route string.
 */
export const notificationRouter = (notification: Notification): string => {
  const { type, metadata } = notification;
  const id = metadata?.resourceId || "";

  switch (type) {
    case "APPROVAL_REQUESTED":
      return `/adoption/${id}#approvals`;
    case "ESCROW_FUNDED":
      return `/adoption/${id}/settlement`;
    case "DISPUTE_RAISED":
      return `/disputes/${id}`;
    case "SETTLEMENT_COMPLETE":
      return `/adoption/${id}/settlement`;
    case "DOCUMENT_EXPIRING":
      return `/adoption/${id}/documents`;
    case "CUSTODY_EXPIRING":
      return `/custody/${id}`;
    default:
      return "/notifications";
  }
};
