import { useEffect, useRef, useState } from "react";
import { useQuery, type QueryKey } from "@tanstack/react-query";

export interface UsePollingOptions<TData> {
	intervalMs: number;
	stopWhen?: (data: TData | undefined) => boolean;
	pauseOnHidden?: boolean;
	enabled?: boolean;
}

export function usePolling<TData>(
	queryKey: QueryKey,
	fetchFn: () => Promise<TData>,
	options: UsePollingOptions<TData>,
) {
	const { intervalMs, stopWhen, pauseOnHidden = true, enabled = true } = options;
	const [isTabVisible, setIsTabVisible] = useState(
		typeof document !== "undefined" ? !document.hidden : true,
	);
	// Ref mirrors shouldStop so refetchInterval sees updated value synchronously
	const shouldStopRef = useRef(false);

	// Handle visibility change
	useEffect(() => {
		if (!pauseOnHidden || typeof document === "undefined") return;

		const handleVisibilityChange = () => {
			setIsTabVisible(!document.hidden);
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [pauseOnHidden]);

	const query = useQuery({
		queryKey,
		queryFn: fetchFn,
		enabled: enabled,
		refetchInterval: (query) => {
			const data = query.state.data;

			// Check synchronously via ref first (avoids waiting for re-render)
			if (shouldStopRef.current) {
				return false;
			}

			// Check if we should stop polling based on data condition
			if (stopWhen && data && stopWhen(data)) {
				shouldStopRef.current = true;
				return false;
			}

			// Pause polling when tab is hidden
			if (pauseOnHidden && !isTabVisible) {
				return false;
			}

			return intervalMs;
		},
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchOnMount: false,
	});

	return query;
}
