/**
 * C2. Define TypeScript types for the Notification domain.
 *
 * This file provides the canonical notification types used across the
 * notification feature (C3–C10). The `relatedEntityRoute` field enables
 * NotificationDropdown (C8) to deep-link directly to the relevant
 * approval/dispute page.
 *
 * @see https://github.com/amina69/PetAd-Frontend/issues/467
 */

/**
 * Discriminated union of every notification category the backend can emit.
 */
export type NotificationType =
  | "approval_status"
  | "dispute_update"
  | "custody_status"
  | "system";

/**
 * A single notification record.
 *
 * `relatedEntityId` and `relatedEntityRoute` are nullable because system-level
 * notifications may not be tied to a specific adoption, dispute, or custody
 * record.
 */
export interface Notification {
  /** Unique identifier for the notification. */
  id: string;

  /** Category of the notification — drives the icon and routing logic. */
  type: NotificationType;

  /** Short headline displayed in bold inside the notification item. */
  title: string;

  /** Longer body text providing additional context. */
  body: string;

  /** Whether the user has read this notification. */
  isRead: boolean;

  /** ISO-8601 timestamp of when the notification was created. */
  createdAt: string;

  /** Optional ID of the related adoption, dispute, or custody record. */
  relatedEntityId: string | null;

  /**
   * Optional client-side route that deep-links to the entity described by
   * `relatedEntityId`. For example `/adoption/abc123` or `/disputes/xyz789`.
   */
  relatedEntityRoute: string | null;
}
