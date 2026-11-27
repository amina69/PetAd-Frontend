/**
 * NotificationDropdown — lazy-loaded notification panel trigger (issue #545).
 *
 * Re-exports the DeferredNotificationCentreDropdown so the notification panel
 * chunk is not included in the initial bundle. The panel is fetched only when
 * the user clicks the bell icon for the first time.
 *
 * Import this alias anywhere you would otherwise import the notification bell
 * directly; it is a drop-in replacement.
 */
export { DeferredNotificationCentreDropdown as NotificationDropdown } from "../notifications/DeferredNotificationCentreDropdown";
