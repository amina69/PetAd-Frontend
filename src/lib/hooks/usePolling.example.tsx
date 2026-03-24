/**
 * Example usage of the usePolling hook
 * 
 * This file demonstrates various use cases for the usePolling hook
 * with React Query for automatic data polling with pause and stop capabilities.
 */

import { usePolling } from "./usePolling";

// Example 1: Basic polling for adoption status
export function AdoptionStatusTracker({ adoptionId }: { adoptionId: string }) {
	const { data, isLoading, error } = usePolling(
		["adoption-status", adoptionId],
		async () => {
			const response = await fetch(`/api/adoptions/${adoptionId}/status`);
			return response.json();
		},
		{
			intervalMs: 5000, // Poll every 5 seconds
			stopWhen: (data) => 
				data?.status === "completed" || data?.status === "cancelled",
			pauseOnHidden: true, // Pause when tab is hidden
		},
	);

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div>Error: {error.message}</div>;

	return (
		<div>
			<h2>Adoption Status</h2>
			<p>Status: {data?.status}</p>
			<p>Progress: {data?.progress}%</p>
		</div>
	);
}

// Example 2: Polling with conditional enabling
export function PetLocationTracker({ 
	petId, 
	isTracking 
}: { 
	petId: string; 
	isTracking: boolean;
}) {
	const { data } = usePolling(
		["pet-location", petId],
		async () => {
			const response = await fetch(`/api/pets/${petId}/location`);
			return response.json();
		},
		{
			intervalMs: 10000, // Poll every 10 seconds
			enabled: isTracking, // Only poll when tracking is enabled
			pauseOnHidden: true,
		},
	);

	return (
		<div>
			<h3>Pet Location</h3>
			{data && (
				<p>
					Lat: {data.latitude}, Lng: {data.longitude}
				</p>
			)}
		</div>
	);
}

// Example 3: Polling without pause on hidden
export function NotificationPoller() {
	const { data } = usePolling(
		["notifications"],
		async () => {
			const response = await fetch("/api/notifications/unread");
			return response.json();
		},
		{
			intervalMs: 30000, // Poll every 30 seconds
			pauseOnHidden: false, // Continue polling even when tab is hidden
		},
	);

	return (
		<div>
			{data?.count > 0 && (
				<span className="badge">{data.count} new notifications</span>
			)}
		</div>
	);
}

// Example 4: Polling with terminal status check
export function DocumentProcessingStatus({ documentId }: { documentId: string }) {
	const { data, isLoading } = usePolling(
		["document-processing", documentId],
		async () => {
			const response = await fetch(`/api/documents/${documentId}/status`);
			return response.json();
		},
		{
			intervalMs: 2000, // Poll every 2 seconds
			stopWhen: (data) => {
				// Stop polling when processing is complete or failed
				const terminalStatuses = ["completed", "failed", "error"];
				return terminalStatuses.includes(data?.status);
			},
		},
	);

	if (isLoading) return <div>Processing document...</div>;

	return (
		<div>
			<h3>Document Status</h3>
			<p>Status: {data?.status}</p>
			{data?.status === "processing" && (
				<progress value={data?.progress} max="100" />
			)}
			{data?.status === "completed" && <p>✓ Processing complete!</p>}
			{data?.status === "failed" && <p>✗ Processing failed: {data?.error}</p>}
		</div>
	);
}
