import { NotificationPreferences } from "../../features/notifications/components/NotificationPreferences";

export default function NotificationsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Notification Settings</h1>
      <p className="mb-6 text-sm text-gray-500">
        Choose which events you want to be notified about. Changes save automatically.
      </p>
      <NotificationPreferences />
    </div>
  );
}
