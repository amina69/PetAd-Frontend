import { useEffect } from "react";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { adoptionService } from "../../../api/adoptionService";
import { useNotificationSocket } from "../../../context/NotificationSocketContext";
import {
  adoptionStatusSchema,
  type AdoptionStatusPayload,
} from "../schemas/adoptionStatusSchema";
import {
  getAdoptionStatusConfig,
  isTerminalAdoptionStatus,
  type AdoptionStatusConfigEntry,
} from "../constants/statusConfig";

/**
 * Poll the adoption status endpoint every 30 seconds while the status is
 * non-terminal. Polling stops automatically once a terminal status
 * (COMPLETED / REJECTED / CANCELLED) arrives — see `ADOPTION_STATUS_CONFIG`.
 */
export const ADOPTION_STATUS_POLL_INTERVAL_MS = 30_000;

export interface UseAdoptionStatusResult {
  /** Validated status payload, or undefined while loading/errored. */
  data: AdoptionStatusPayload | undefined;
  isLoading: boolean;
  isError: boolean;
  isForbidden: boolean;
  isNotFound: boolean;
  /** True once the status is terminal — polling has stopped. */
  isTerminal: boolean;
  /** Config entry (label/step/tone) for the current status, if known. */
  statusConfig: AdoptionStatusConfigEntry | undefined;
  /** Re-run the query — used by error/retry affordances. */
  refetch: () => void;
}

/**
 * useAdoptionStatus
 *
 * Tracks a single adoption's status via the existing status endpoint
 * (`GET /adoption/:id`).
 *
 * - Polls every 30 s while the status is non-terminal and stops polling at
 *   terminal states (COMPLETED / REJECTED / CANCELLED).
 * - Also refetches immediately when a live notification whose
 *   `payload.metadata.resourceId` matches this adoption id arrives on the
 *   shared notification WebSocket, so adopters see transitions without
 *   waiting for the next poll.
 * - The response is runtime-validated with `adoptionStatusSchema` so backend
 *   contract drift surfaces as an error state instead of broken UI.
 *
 * @param adoptionId - The adoption to track. Pass "" to disable the query.
 */
export function useAdoptionStatus(adoptionId: string): UseAdoptionStatusResult {
  const { lastMessage } = useNotificationSocket();

  const result = useApiQuery<AdoptionStatusPayload>(
    ["adoption", adoptionId, "status"],
    async () => {
      const payload = await adoptionService.getDetails(adoptionId);
      return adoptionStatusSchema.parse(payload);
    },
    {
      enabled: !!adoptionId,
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        // Stop polling once the outcome is final.
        if (isTerminalAdoptionStatus(status)) {
          return false;
        }
        return ADOPTION_STATUS_POLL_INTERVAL_MS;
      },
    },
  );

  // Refetch when a live notification for THIS adoption arrives. The effect
  // re-runs only when a new frame lands because `lastMessage` gains a new
  // identity per message; unrelated notifications are filtered out by the
  // resourceId match.
  const { refetch } = result;
  const resourceId =
    typeof lastMessage?.payload?.metadata?.resourceId === "string"
      ? lastMessage.payload.metadata.resourceId
      : undefined;

  useEffect(() => {
    if (!adoptionId || !resourceId || resourceId !== adoptionId) {
      return;
    }
    void refetch();
  }, [adoptionId, resourceId, refetch]);

  const status = result.data?.status;

  return {
    data: result.data,
    isLoading: result.isLoading,
    isError: result.isError,
    isForbidden: result.isForbidden,
    isNotFound: result.isNotFound,
    isTerminal: isTerminalAdoptionStatus(status),
    statusConfig: status ? getAdoptionStatusConfig(status) : undefined,
    refetch: () => {
      void result.refetch();
    },
  };
}
