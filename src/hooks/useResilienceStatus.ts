import { useSyncExternalStore } from "react";
import {
  getResilienceStatus,
  subscribeToResilienceStatus,
} from "../lib/resilience";

export function useResilienceStatus() {
  return useSyncExternalStore(
    subscribeToResilienceStatus,
    getResilienceStatus,
    getResilienceStatus,
  );
}
