import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api-client";

export type EscrowTimelineEventType =
	| "CREATED"
	| "FUNDED"
	| "DISPUTED"
	| "PAUSED"
	| "SETTLED"
	| "SETTLEMENT_FAILED"
	| string;

export interface EscrowTimelineEvent {
	type: EscrowTimelineEventType;
	label: string;
	timestamp: string;
	stellarExplorerUrl?: string;
}

export interface UseEscrowTimelineOptions {
	enabled?: boolean;
}

export function useEscrowTimeline(
	adoptionId: string | undefined,
	options?: UseEscrowTimelineOptions,
) {
	const enabled = Boolean(adoptionId) && (options?.enabled ?? true);

	const query = useQuery({
		queryKey: ["escrow-timeline", adoptionId],
		queryFn: () =>
			apiClient.get<EscrowTimelineEvent[]>(
				`/adoption/${adoptionId}/escrow/timeline`,
			),
		enabled,
	});

	return {
		data: query.data,
		isLoading: query.isLoading,
		isError: query.isError,
	};
}

