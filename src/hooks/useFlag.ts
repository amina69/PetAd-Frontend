import { useSyncExternalStore } from "react";
import {
  getFeatureFlags,
  subscribeToFeatureFlags,
  type FeatureFlagName,
} from "../lib/flags";

export function useFlag(name: FeatureFlagName): boolean {
  const flags = useSyncExternalStore(
    subscribeToFeatureFlags,
    getFeatureFlags,
    getFeatureFlags,
  );
  return flags[name];
}
