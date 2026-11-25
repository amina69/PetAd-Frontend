import { apiClient } from "./api-client";
import { logger } from "./logger";

export const FEATURE_FLAG_NAMES = [
  "darkMode",
  "pushNotifications",
  "messaging",
] as const;

export type FeatureFlagName = (typeof FEATURE_FLAG_NAMES)[number];
export type FeatureFlags = Readonly<Record<FeatureFlagName, boolean>>;

function getDefaults(): FeatureFlags {
  return {
    darkMode: import.meta.env.VITE_FLAG_DARK_MODE === "true",
    pushNotifications: import.meta.env.VITE_FLAG_PUSH_NOTIFICATIONS === "true",
    messaging: import.meta.env.VITE_FLAG_MESSAGING === "true",
  };
}

let flags: FeatureFlags = getDefaults();
let loading: Promise<FeatureFlags> | undefined;
const listeners = new Set<() => void>();

export function getFeatureFlags(): FeatureFlags {
  return flags;
}

export function subscribeToFeatureFlags(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function publish(nextFlags: FeatureFlags): FeatureFlags {
  flags = nextFlags;
  for (const listener of listeners) listener();
  return flags;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseServerFlags(value: unknown): Partial<Record<FeatureFlagName, boolean>> {
  if (!isRecord(value)) {
    throw new TypeError("Feature flag response must be an object");
  }

  const source = isRecord(value.flags) ? value.flags : value;
  const result: Partial<Record<FeatureFlagName, boolean>> = {};

  for (const name of FEATURE_FLAG_NAMES) {
    if (typeof source[name] === "boolean") {
      result[name] = source[name];
    }
  }

  return result;
}

/** Fetch server flags once at startup, retaining safe env defaults on failure. */
export function loadFeatureFlags(): Promise<FeatureFlags> {
  if (!loading) {
    loading = apiClient
      .get<unknown>("/flags")
      .then((response) =>
        publish({ ...getDefaults(), ...parseServerFlags(response) }),
      )
      .catch((error: unknown) => {
        logger.warn("Failed to load feature flags; using defaults", error);
        return publish(getDefaults());
      });
  }

  return loading;
}

export function __resetFeatureFlagsForTests(): void {
  loading = undefined;
  publish(getDefaults());
}
