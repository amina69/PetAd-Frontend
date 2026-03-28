import { useState, useEffect, useRef } from "react";
import { usePolling } from "./usePolling";
import { adoptionService } from "../../api/adoptionService";
import { custodyService } from "../../api/custodyService";
import type { AdoptionDetails, CustodyDetails } from "../../types/adoption";

type EntityType = "adoption" | "custody";
const SUPPORTED_ENTITY_TYPES = ["adoption", "custody"] as const;

export interface UseRealTimeStatusPollingOptions {
  intervalMs?: number;
}

export function useRealTimeStatusPolling(
  entityType: EntityType,
  entityId: string,
  options: UseRealTimeStatusPollingOptions = {},
) {
  if (!SUPPORTED_ENTITY_TYPES.includes(entityType)) {
    throw new Error(`Unsupported entity type: ${entityType}`);
  }

  const { intervalMs = 15000 } = options;
  const [statusChanged, setStatusChanged] = useState(false);
  const previousStatusRef = useRef<string | undefined>(undefined);

  // Determine the fetch function based on entity type
  const fetchFn = (): Promise<AdoptionDetails | CustodyDetails> => {
    switch (entityType) {
      case "adoption":
        return adoptionService.getDetails(entityId);
      case "custody":
        return custodyService.getDetails(entityId);
    }
  };

  // Determine if polling should stop based on terminal statuses
  const stopWhen = (data: AdoptionDetails | CustodyDetails | undefined) => {
    if (!data) return false;
    return data.status === "COMPLETED" || data.status === "CANCELLED";
  };

  const query = usePolling([entityType, entityId], fetchFn, {
    intervalMs,
    stopWhen,
  });

  // Track status changes and trigger pulse animation
  useEffect(() => {
    const currentStatus = query.data?.status;

    if (!currentStatus) {
      return;
    }

    if (previousStatusRef.current === undefined) {
      previousStatusRef.current = currentStatus;
      return;
    }

    if (previousStatusRef.current !== currentStatus) {
      setStatusChanged(true);
      previousStatusRef.current = currentStatus;

      const timer = setTimeout(() => {
        setStatusChanged(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [query.data?.status]);

  return {
    data: query.data,
    statusChanged,
    isLoading: query.isLoading,
  };
}
