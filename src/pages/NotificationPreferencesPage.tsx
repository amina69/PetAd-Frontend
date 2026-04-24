import { useCallback, useEffect, useRef, useState } from "react";
import { useNotificationPreferences } from "../hooks/useNotificationPreferences";
import { useMutateUpdatePreferences } from "../hooks/useMutateUpdatePreferences";
import { ToggleSwitch } from "../components/ui/ToggleSwitch";
import { ConfirmationModal } from "../components/modals/ConfirmationModal";
import type { NotificationPreferences } from "../types/notifications";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "../types/notifications";

const NOTIFICATION_LABELS: Record<keyof NotificationPreferences, string> = {
  APPROVAL_REQUESTED: "Approval Requested",
  ESCROW_FUNDED: "Escrow Funded",
  DISPUTE_RAISED: "Dispute Raised",
  SETTLEMENT_COMPLETE: "Settlement Complete",
  DOCUMENT_EXPIRING: "Document Expiring",
  CUSTODY_EXPIRING: "Custody Expiring",
};

export default function NotificationPreferencesPage() {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreferences = useMutateUpdatePreferences();
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const debounceTimerRef = useRef<number | null>(null);
  const savedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  const showSavedConfirmation = useCallback(() => {
    if (savedTimerRef.current) {
      clearTimeout(savedTimerRef.current);
    }

    setShowSaved(true);
    savedTimerRef.current = window.setTimeout(() => {
      setShowSaved(false);
      savedTimerRef.current = null;
    }, 2000);
  }, []);

  const clearPendingDebounce = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearPendingDebounce();

      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
    };
  }, [clearPendingDebounce]);

  const handleToggleChange = useCallback((key: keyof NotificationPreferences, value: boolean) => {
    if (!localPreferences) return;

    const newPreferences = { ...localPreferences, [key]: value };
    setLocalPreferences(newPreferences);
    clearPendingDebounce();

    debounceTimerRef.current = window.setTimeout(() => {
      updatePreferences.mutate(newPreferences, {
        onSuccess: () => {
          showSavedConfirmation();
        },
      });
      debounceTimerRef.current = null;
    }, 500);
  }, [clearPendingDebounce, localPreferences, updatePreferences, showSavedConfirmation]);

  const handleReset = useCallback(() => {
    setShowResetModal(true);
  }, []);

  const confirmReset = useCallback(() => {
    clearPendingDebounce();
    const resetPreferences = { ...DEFAULT_NOTIFICATION_PREFERENCES };
    setLocalPreferences(resetPreferences);
    updatePreferences.mutate(resetPreferences, {
      onSuccess: () => {
        setShowResetModal(false);
        showSavedConfirmation();
        },
      });
  }, [clearPendingDebounce, updatePreferences, showSavedConfirmation]);

  if (isLoading || !localPreferences) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Notification Preferences</h1>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Notification Preferences</h1>
          <p className="text-gray-600">Choose which notifications you'd like to receive</p>
        </div>

        <div className="space-y-4">
          {(Object.keys(localPreferences) as Array<keyof NotificationPreferences>).map((key) => (
            <ToggleSwitch
              key={key}
              checked={localPreferences[key]}
              onChange={(checked) => handleToggleChange(key, checked)}
              label={NOTIFICATION_LABELS[key]}
              disabled={updatePreferences.isPending}
            />
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button
            data-testid="reset-preferences"
            onClick={handleReset}
            className="rounded-xl border-2 border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            disabled={updatePreferences.isPending}
          >
            Reset to defaults
          </button>

          {showSaved && (
            <div className="rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-800">
              Saved
            </div>
          )}
        </div>

        <ConfirmationModal
          isOpen={showResetModal}
          onCancel={() => setShowResetModal(false)}
          onConfirm={confirmReset}
          title="Reset Preferences"
          body="Are you sure you want to reset all notification preferences to their default settings? This action cannot be undone."
          confirmLabel="Reset"
        />
      </div>
    </div>
  );
}
