import React from "react";

export type NotificationType =
  | "APPROVAL_REQUESTED"
  | "ESCROW_FUNDED"
  | "DISPUTE_RAISED"
  | "SETTLEMENT_COMPLETE"
  | "DOCUMENT_EXPIRING"
  | "CUSTODY_EXPIRING"
  | "success"
  | "adoption"
  | "reminder";

export type NotificationFilter = "all" | "unread" | "read";

export interface Notification {
  id: string | number;
  type: NotificationType;
  title: string;
  message: string | React.ReactNode;
  time: string;
  isRead?: boolean;
  hasArrow?: boolean;
  metadata?: {
    resourceId: string;
    [key: string]: unknown;
  };
}

export interface NotificationsPage {
  data: Notification[];
  nextCursor: string | null;
  total: number;
}