import { usePolling, type UsePollingOptions } from "./usePolling";
import { apiClient } from "../api-client";

export type EscrowStatusValue =
	| "PENDING"
	| "FUNDED"
	| "SETTLED"
	| "SETTLEMENT_FAILED"
	| string;

export interface EscrowStatusResponse {
	status: EscrowStatusValue;
	[key: string]: unknown;
}

export interface UseEscrowStatusOptions
	extends Partial<Omit<UsePollingOptions<EscrowStatusResponse>, "intervalMs">> {
	intervalMs?: number;
}

const TERMINAL_STATUSES = new Set<EscrowStatusValue>([
	"SETTLED",
	"SETTLEMENT_FAILED",
]);

export function useEscrowStatus(
	escrowId: string | undefined,
	options?: UseEscrowStatusOptions,
) {
	const enabled = Boolean(escrowId) && (options?.enabled ?? true);
	const intervalMs = options?.intervalMs ?? 15000;

	const query = usePolling(
		["escrow-status", escrowId],
		() => apiClient.get<EscrowStatusResponse>(`/escrow/${escrowId}/status`),
		{
			intervalMs,
			enabled,
			pauseOnHidden: options?.pauseOnHidden,
			stopWhen: (data) =>
				(!!data && TERMINAL_STATUSES.has(data.status)) ||
				(options?.stopWhen?.(data) ?? false),
		},
	);

	return {
		data: query.data,
		isLoading: query.isLoading,
		isError: query.isError,
		refetch: query.refetch,
	};
}
