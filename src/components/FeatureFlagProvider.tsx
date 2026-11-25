import { useEffect, type ReactNode } from "react";
import { loadFeatureFlags } from "../lib/flags";

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    void loadFeatureFlags();
  }, []);

  return children;
}
