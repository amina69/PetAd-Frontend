import { useState, useEffect } from "react";
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
  const [prevStatus, setPrevStatus] = useState<string | undefined>(undefined);

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

  const currentStatus = query.data?.status;

  // Track status changes and trigger pulse animation
  // Use state instead of ref to avoid react-hooks/refs error
  if (currentStatus && prevStatus !== undefined && currentStatus !== prevStatus) {
    setPrevStatus(currentStatus);
    setStatusChanged(true);
  } else if (currentStatus && prevStatus === undefined) {
    setPrevStatus(currentStatus);
  }

  // Handle clearing the status changed flag after a duration
  useEffect(() => {
    if (statusChanged) {
      const timer = setTimeout(() => {
        setStatusChanged(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [statusChanged]);

  return {
    data: query.data,
    statusChanged,
    isLoading: query.isLoading,
  };
}
