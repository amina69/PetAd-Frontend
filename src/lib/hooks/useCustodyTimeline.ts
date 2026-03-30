import { useQuery } from "@tanstack/react-query";
import { custodyService, type CustodyTimelineEvent } from "../../api/custodyService";

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
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
