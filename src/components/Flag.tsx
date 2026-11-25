import type { ReactNode } from "react";
import { useFlag } from "../hooks/useFlag";
import type { FeatureFlagName } from "../lib/flags";

export function Flag({
  name,
  children,
  fallback = null,
}: {
  name: FeatureFlagName;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return useFlag(name) ? children : fallback;
}
