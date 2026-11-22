import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/api-client";
import { useNotificationPreferences } from "../../../hooks/useNotificationPreferences";
import type {
  NotificationPreferenceType,
  NotificationPreferences,
} from "../../../types/notifications";

/** Shared with `useNotificationPreferences` so every consumer sees one cache entry. */
export const NOTIFICATION_PREFERENCES_QUERY_KEY = ["notificationPreferences"] as const;

const UPDATE_PREFERENCE_MUTATION_KEY = ["notificationPreferences", "update"] as const;

interface ToggleVariables {
  type: NotificationPreferenceType;
  enabled: boolean;
}

interface ToggleContext {
  previousValue: boolean | undefined;
}

export interface UsePreferencesResult {
  preferences: NotificationPreferences | undefined;
  isLoading: boolean;
  isError: boolean;
  /** Types whose save is currently in flight. */
  pendingTypes: ReadonlySet<NotificationPreferenceType>;
  /** Types whose most recent save failed (and was rolled back). */
  failedTypes: ReadonlySet<NotificationPreferenceType>;
  setPreference: (type: NotificationPreferenceType, enabled: boolean) => void;
}

function withItem<T>(set: ReadonlySet<T>, item: T): Set<T> {
  const next = new Set(set);
  next.add(item);
  return next;
}

function withoutItem<T>(set: ReadonlySet<T>, item: T): Set<T> {
  const next = new Set(set);
  next.delete(item);
  return next;
}

/**
 * C29. Notification preference toggles with optimistic updates.
 *
 * Each toggle PATCHes only the changed type, so rolling back one failed save
 * never clobbers a sibling toggle that succeeded in the meantime.
 *
 * @see https://github.com/amina69/PetAd-Frontend/issues/624
 */
export function usePreferences(): UsePreferencesResult {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useNotificationPreferences();
  const [pendingTypes, setPendingTypes] = useState<ReadonlySet<NotificationPreferenceType>>(
    () => new Set(),
  );
  const [failedTypes, setFailedTypes] = useState<ReadonlySet<NotificationPreferenceType>>(
    () => new Set(),
  );

  const mutation = useMutation<NotificationPreferences, Error, ToggleVariables, ToggleContext>({
    mutationKey: UPDATE_PREFERENCE_MUTATION_KEY,
    mutationFn: ({ type, enabled }) =>
      apiClient.patch<NotificationPreferences>("/notifications/preferences", {
        [type]: enabled,
      }),
    // Per-type bookkeeping lives in these hook-level callbacks rather than in
    // `mutate(…, callbacks)`: per-call callbacks only fire for the latest call,
    // which would lose track of concurrent toggles.
    onMutate: async ({ type, enabled }) => {
      setFailedTypes((current) => withoutItem(current, type));
      setPendingTypes((current) => withItem(current, type));
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY });
      const previous = queryClient.getQueryData<NotificationPreferences>(
        NOTIFICATION_PREFERENCES_QUERY_KEY,
      );
      if (previous) {
        queryClient.setQueryData<NotificationPreferences>(
          NOTIFICATION_PREFERENCES_QUERY_KEY,
          { ...previous, [type]: enabled },
        );
      }
      return { previousValue: previous?.[type] };
    },
    onError: (_error, { type }, context) => {
      setFailedTypes((current) => withItem(current, type));
      if (context?.previousValue === undefined) return;
      queryClient.setQueryData<NotificationPreferences>(
        NOTIFICATION_PREFERENCES_QUERY_KEY,
        (current) => (current ? { ...current, [type]: context.previousValue } : current),
      );
    },
    onSettled: (_data, _error, { type }) => {
      setPendingTypes((current) => withoutItem(current, type));
      // Refetch only once the last in-flight toggle settles, so a refetch
      // cannot overwrite another toggle's optimistic value mid-flight.
      if (queryClient.isMutating({ mutationKey: UPDATE_PREFERENCE_MUTATION_KEY }) <= 1) {
        queryClient.invalidateQueries({ queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY });
      }
    },
  });

  const { mutate } = mutation;

  const setPreference = useCallback(
    (type: NotificationPreferenceType, enabled: boolean) => {
      mutate({ type, enabled });
    },
    [mutate],
  );

  return {
    preferences: data,
    isLoading,
    isError,
    pendingTypes,
    failedTypes,
    setPreference,
  };
}
