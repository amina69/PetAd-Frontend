/**
 * Privacy Consent Management
 *
 * - Stores user consent choices in localStorage with versioning
 * - Granular categories: necessary, analytics, error tracking
 * - Nothing non-essential loads before consent is obtained
 * - Withdrawing consent stops further events immediately
 */

const STORAGE_KEY = "petad:consent";
const STORAGE_VERSION = 1;

// Consent categories
export type ConsentCategory = "necessary" | "analytics" | "errorTracking";

export interface ConsentState {
  /** Whether necessary cookies are accepted (always true, cannot be disabled) */
  necessary: boolean;
  /** Whether analytics cookies are accepted */
  analytics: boolean;
  /** Whether error tracking cookies are accepted */
  errorTracking: boolean;
  /** When consent was given (epoch ms) */
  timestamp: number;
  /** Storage version for policy changes */
  version: number;
}

/**
 * Default consent state: necessary is always true, others false
 */
const defaultConsent: ConsentState = {
  necessary: true,
  analytics: false,
  errorTracking: false,
  timestamp: 0,
  version: STORAGE_VERSION,
};

/**
 * Get the consent state from localStorage
 */
export function getConsentState(): ConsentState {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return defaultConsent;
    const parsed = JSON.parse(serialized);

    // Validate version and merge with defaults for missing fields
    return {
      necessary: parsed.necessary !== undefined ? parsed.necessary : defaultConsent.necessary,
      analytics: parsed.analytics !== undefined ? parsed.analytics : defaultConsent.analytics,
      errorTracking: parsed.errorTracking !== undefined ? parsed.errorTracking : defaultConsent.errorTracking,
      timestamp: parsed.timestamp !== undefined ? parsed.timestamp : defaultConsent.timestamp,
      version: parsed.version !== undefined ? parsed.version : STORAGE_VERSION,
    };
  } catch (error) {
    // If parsing fails, return defaults
    console.warn("Failed to parse consent state, using defaults", error);
    return defaultConsent;
  }
}

/**
 * Save consent state to localStorage
 */
export function setConsentState(state: ConsentState): void {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    // localStorage might be full or disabled in private mode
    console.warn("Failed to save consent state", error);
  }
}

/**
 * Update a specific consent category
 */
export function updateConsentCategory(
  category: ConsentCategory,
  accepted: boolean
): ConsentState {
  const current = getConsentState();
  const newState: ConsentState = {
    ...current,
    [category]: accepted,
    timestamp: Date.now(),
    version: STORAGE_VERSION,
  };
  setConsentState(newState);
  return newState;
}

/**
 * Check if a given category is consented to
 */
export function hasConsent(category: ConsentCategory): boolean {
  return getConsentState()[category];
}

/**
 * Reset all non-necessary consent (e.g., for privacy policy updates)
 */
export function resetNonNecessaryConsent(): ConsentState {
  const newState: ConsentState = {
    necessary: true,
    analytics: false,
    errorTracking: false,
    timestamp: Date.now(),
    version: STORAGE_VERSION,
  };
  setConsentState(newState);
  return newState;
}

/**
 * Get all consent categories as a record
 */
export function getAllConsent(): Record<ConsentCategory, boolean> {
  const state = getConsentState();
  return {
    necessary: state.necessary,
    analytics: state.analytics,
    errorTracking: state.errorTracking,
  };
}