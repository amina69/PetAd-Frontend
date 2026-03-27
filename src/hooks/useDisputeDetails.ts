import { disputeService } from "../api/disputeService";
import type { DisputeDetails } from "../types/dispute";
import { useApiQuery } from "./useApiQuery";

export function useDisputeDetails(disputeId: string) {
	return useApiQuery<DisputeDetails>(
		["disputes", disputeId, "details"],
		() => disputeService.getDetails(disputeId),
		{
			enabled: !!disputeId,
		},
	);
}