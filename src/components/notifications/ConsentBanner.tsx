import { useState, useEffect } from "react";
import { getConsentState, hasConsent, updateConsentCategory } from "../../lib/consent";
import { trackEvent } from "../../lib/analytics";

/**
 * ConsentBanner — appears at the top of the app for users who haven't
 * given analytics/error-tracking consent yet.
 *
 * - Necessary cookies are always accepted (cannot be disabled)
 * - Analytics and error tracking require explicit opt-in
 * - Choice is persisted in localStorage via the consent library
 * - "Manage cookies" link routes to the preferences page
 */
export function ConsentBanner() {
  const [showBanner, setShowBanner] = useState(true);
  const consentState = getConsentState();
  const { analytics, errorTracking } = consentState;
  const hasAnyNonNecessary = hasConsent("analytics") || hasConsent("errorTracking");

  // If the user has already made a choice for non-necessary categories, hide banner
  useEffect(() => {
    if (hasAnyNonNecessary) {
      setShowBanner(false);
    }
  }, [hasAnyNonNecessary]);

  const acceptAnalytics = () => {
    // Update consent state
    updateConsentCategory("analytics", true);
    trackEvent("consent_accepted", { category: "analytics" });
    setShowBanner(false);
  };

  const acceptErrorTracking = () => {
    // Update consent state
    updateConsentCategory("errorTracking", true);
    trackEvent("consent_accepted", { category: "errorTracking" });
    setShowBanner(false);
  };

  const manageCookies = () => {
    // Navigate to preferences or just prevent default
    // In a real app, this would route to ConsentPreferencesPage
    window.location.href = "/consent-preferences";
  };

  if (!showBanner) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm"
      aria-labelledby="consent-banner-title"
    >
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5 text-yellow-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h1v4h1m-1-4h1v4H9.92a1 1 0 01-.95-.84L7 10.93a1 1 0 01-.59-.35H4m16 0a9 9 0 01-18 0 9 9 0 0118 0zM7 10a1 1 0 012 0v5a1 1 0 01-2 0V10zm15-4a9 9 0 01-18 0 9 9 0 0118 0zM7 10a1 1 0 012 0v5a1 1 0 01-2 0V10z"
            />
          </svg>
          <span id="consent-banner-title" className="text-sm font-medium text-gray-900">
            PetAd Cookies & Tracking
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          {/* Necessary - always on */}
          <span className="flex items-center gap-1">
            <svg
              className="w-3 h-3 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <circle cx="12" cy="12" r="10" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01"
              />
            </svg>
            Necessary
          </span>

          {/* Analytics */}
          <span className="hidden sm:inline-flex items-center gap-1">
            <input
              type="checkbox"
              checked={analytics}
              onChange={() => acceptAnalytics()}
              className="rounded border-gray-300 focus:ring-yellow-500"
            />
            Analytics
          </span>

          {/* Error tracking */}
          <span className="hidden sm:inline-flex items-center gap-1">
            <input
              type="checkbox"
              checked={errorTracking}
              onChange={() => acceptErrorTracking()}
              className="rounded border-gray-300 focus:ring-yellow-500"
            />
            Error Tracking
          </span>
        </div>
      </div>

      <div className="px-6 py-2 flex justify-between text-xs text-gray-500">
        <button
          onClick={manageCookies}
          className="underline underline-offset-2 hover:text-[#E84D2A]"
        >
          Manage cookies
        </button>

        <button
          onClick={manageCookies}
          className="underline underline-offset-2 hover:text-[#E84D2A]"
        >
          Accept all
        </button>
      </div>
    </div>
  );
}