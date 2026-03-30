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

export type NotificationPreferenceType =
  | "APPROVAL_REQUESTED"
  | "ESCROW_FUNDED"
  | "DISPUTE_RAISED"
  | "SETTLEMENT_COMPLETE"
  | "DOCUMENT_EXPIRING"
  | "CUSTODY_EXPIRING";

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

export interface NotificationPreferences {
  APPROVAL_REQUESTED: boolean;
  ESCROW_FUNDED: boolean;
  DISPUTE_RAISED: boolean;
  SETTLEMENT_COMPLETE: boolean;
  DOCUMENT_EXPIRING: boolean;
  CUSTODY_EXPIRING: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  APPROVAL_REQUESTED: true,
  ESCROW_FUNDED: true,
  DISPUTE_RAISED: true,
  SETTLEMENT_COMPLETE: true,
  DOCUMENT_EXPIRING: true,
  CUSTODY_EXPIRING: true,
};

export interface NotificationsPage {
  data: Notification[];
  nextCursor: string | null;
  total: number;
}