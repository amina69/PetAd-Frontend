import { useQuery } from "@tanstack/react-query";
import { custodyService, type CustodyTimelineEvent } from "../../api/custodyService";
import { STALE_TIME } from "../staleTime";

export type { CustodyTimelineEvent };

export type CustodyTimelineEventType =
  | "CREATED"
  | "FUNDED"
  | "DISPUTED"
  | "PAUSED"
  | "SETTLED"
  | "SETTLEMENT_FAILED"
  | string;

export interface UseCustodyTimelineOptions {
  enabled?: boolean;
}

export function useCustodyTimeline(
  custodyId: string | undefined,
  options?: UseCustodyTimelineOptions,
) {
  const enabled = Boolean(custodyId) && (options?.enabled ?? true);

  const query = useQuery<CustodyTimelineEvent[]>({
    queryKey: ["custody-timeline", custodyId],
    queryFn: () => custodyService.getTimeline(custodyId!),
    enabled,
    // Custody timelines are append-only, so a short cache avoids refetching on every navigation.
    staleTime: STALE_TIME.TIMELINES,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
