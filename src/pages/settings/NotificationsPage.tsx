import { NotificationPreferences } from "../../features/notifications/components/NotificationPreferences";
import { Download } from "lucide-react";

interface NotificationsPageProps {
  installPrompt: {
    canInstall: boolean;
    error: string;
    install: () => void;
    dismiss: () => void;
  };
}

export default function NotificationsPage({ installPrompt }: NotificationsPageProps) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Notification Settings</h1>
      <p className="mb-6 text-sm text-gray-500">
        Choose which events you want to be notified about. Changes save automatically.
      </p>
      {(installPrompt.canInstall || installPrompt.error) && (
        <section className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <Download aria-hidden="true" className="text-[#E84D2A]" />
            <div>
              <h2 className="font-semibold text-gray-900">Install PetAd</h2>
              <p className="text-sm text-gray-600">Add PetAd to your device for quick access.</p>
            </div>
          </div>
          {installPrompt.canInstall && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={installPrompt.install}
                className="rounded-lg bg-[#0D162B] px-4 py-2 text-sm font-semibold text-white"
              >
                Install app
              </button>
              <button
                type="button"
                onClick={installPrompt.dismiss}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
              >
                Not now
              </button>
            </div>
          )}
          {installPrompt.error && (
            <p role="status" className="basis-full text-sm text-red-700">{installPrompt.error}</p>
          )}
        </section>
      )}
      <NotificationPreferences />
    </div>
  );
}
