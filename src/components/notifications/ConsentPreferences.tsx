import { useState, useEffect } from "react";
import { trackEvent } from "../../lib/analytics";

export function ConsentPreferences() {
  const [analytics, setAnalytics] = useState<boolean>(false);
  const [errorTracking, setErrorTracking] = useState<boolean>(false);

  // Load current consent on mount
  useEffect(() => {
    const consent = localStorage.getItem("petad:consent");
    if (consent) {
      const state = JSON.parse(consent);
      setAnalytics(state.analytics === true);
      setErrorTracking(state.errorTracking === true);
    }
  }, []);

  const handleRejectAll = () => {
    // Only necessary remains true
    // We don't need to explicitly update since necessary is always true
    trackEvent("consent_rejected_all", {});
  };

  const handleAcceptAll = () => {
    setAnalytics(true);
    setErrorTracking(true);
    trackEvent("consent_accepted_all", {});
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Cookie & Tracking Preferences
        </h2>

        <form
          className="bg-white rounded-xl p-6 shadow-sm space-y-4"
          onSubmit={(e) => e.preventDefault()}
        >
          {/* Necessary section - always enabled */}
          <div>
            <p className="text-sm text-gray-500">
              <span className="font-medium">Necessary cookies</span>
              {/* Always enabled - cannot be disabled */}
              <span className="ml-2 text-green-500">✓ Enabled</span>
            </p>
            <p className="text-xs text-gray-400">
              These cookies are essential for the Platform to function properly.
            </p>
          </div>

          {/* Analytics section */}
          <div>
            <label htmlFor="analytics-consent" className="flex items-center gap-2 cursor-pointer">
              <input
                id="analytics-consent"
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="rounded border-gray-300 focus:ring-yellow-500"
              />
              <span className="text-gray-700">Allow analytics cookies</span>
            </label>
            <p className="text-xs text-gray-400">
              Help us understand how visitors interact with our Platform to improve
              your experience.
            </p>
          </div>

          {/* Error tracking section */}
          <div>
            <label htmlFor="error-tracking-consent" className="flex items-center gap-2 cursor-pointer">
              <input
                id="error-tracking-consent"
                type="checkbox"
                checked={errorTracking}
                onChange={(e) => setErrorTracking(e.target.checked)}
                className="rounded border-gray-300 focus:ring-yellow-500"
              />
              <span className="text-gray-700">Allow error tracking</span>
            </label>
            <p className="text-xs text-gray-400">
              Help us improve stability by reporting client-side errors (no PII).
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              form="preferences-form"
              className="flex-1 flex items-center justify-center py-2 rounded bg-[#E84D2A] text-white font-medium hover:bg-[#d4431f] transition-colors"
              disabled={analytics === false && errorTracking === false}
            >
              Save preferences
            </button>

            <button
              type="button"
              className="flex-1 flex items-center justify-center py-2 rounded border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              onClick={handleRejectAll}
            >
              Reject all
            </button>

            <button
              type="button"
              className="flex-1 flex items-center justify-center py-2 rounded bg-yellow-50 text-yellow-800 font-medium hover:bg-yellow-100 transition-colors"
              onClick={handleAcceptAll}
            >
              Accept all
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
          <p>
            Last updated: {"Last Updated: [Date]"}
          </p>
          <p>
            {"Manage cookies"}{" "}{"in the footer"} to change your settings at any time.
          </p>
        </div>
      </div>
    </div>
  );
}