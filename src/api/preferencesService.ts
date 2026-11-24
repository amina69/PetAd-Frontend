import { apiClient } from "../lib/api-client";

/**
 * Language preference persisted on the user's profile.
 *
 * The endpoint is intentionally isolated here: the rest of the app only talks
 * to `languagePreferenceService`, so the backend route can evolve without
 * touching the i18n provider or the switcher.
 */
export const LANGUAGE_PREFERENCE_ENDPOINT = "/users/me/preferences";

export interface UserPreferences {
  language?: string | null;
}

export const languagePreferenceService = {
  /**
   * Best-effort read of the signed-in user's stored language.
   *
   * Returns `null` when the request fails (offline, older backend without the
   * endpoint, …) so callers can fall back to the local/browser locale.
   */
  async getLanguage(): Promise<string | null> {
    try {
      const preferences = await apiClient.get<UserPreferences>(
        LANGUAGE_PREFERENCE_ENDPOINT,
      );
      return typeof preferences?.language === "string"
        ? preferences.language
        : null;
    } catch {
      return null;
    }
  },

  /**
   * Best-effort write. Language switching must stay instant even when the
   * profile request is slow or failing, so errors are deliberately swallowed
   * here — the local choice has already been persisted by the provider.
   */
  async setLanguage(language: string): Promise<void> {
    try {
      await apiClient.patch<void>(LANGUAGE_PREFERENCE_ENDPOINT, { language });
    } catch {
      // Local persistence already succeeded; the next successful request will
      // bring the profile back in sync.
    }
  },
};
