import { useEffect, useRef, useState } from "react";
import { usePolling } from "./usePolling";
import { adoptionService } from "../../api/adoptionService";
import { custodyService } from "../../api/custodyService";
import type { AdoptionDetails, CustodyDetails } from "../../types/adoption";

type EntityType = "adoption" | "custody";
const SUPPORTED_ENTITY_TYPES = ["adoption", "custody"] as const;
const TERMINAL_STATUSES = new Set(["COMPLETED", "CANCELLED"]);

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
  const resetTimerRef = useRef<number | undefined>(undefined);

  const fetchFn = (): Promise<AdoptionDetails | CustodyDetails> => {
    switch (entityType) {
      case "adoption":
        return adoptionService.getDetails(entityId);
      case "custody":
        return custodyService.getDetails(entityId);
    }
  };

  const stopWhen = (data: AdoptionDetails | CustodyDetails | undefined) => {
    if (!data) return false;
    return TERMINAL_STATUSES.has(data.status);
  };

  const query = usePolling([entityType, entityId], fetchFn, {
    intervalMs,
    stopWhen,
  });

  useEffect(() => {
    const currentStatus = query.data?.status;

    if (!currentStatus) {
      return;
    }

    if (
      previousStatusRef.current !== undefined &&
      currentStatus !== previousStatusRef.current
    ) {
      setStatusChanged(true);
    }

    previousStatusRef.current = currentStatus;
  }, [query.data?.status]);

  useEffect(() => {
    if (!statusChanged) {
      return;
    }

    if (resetTimerRef.current !== undefined) {
      window.clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = window.setTimeout(() => {
      setStatusChanged(false);
      resetTimerRef.current = undefined;
    }, 3000);

    return () => {
      if (resetTimerRef.current !== undefined) {
        window.clearTimeout(resetTimerRef.current);
        resetTimerRef.current = undefined;
      }
    };
  }, [statusChanged]);

  return {
    data: query.data,
    statusChanged,
    isLoading: query.isLoading,
  };
}
