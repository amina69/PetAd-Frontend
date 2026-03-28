import { useRealTimeStatusPolling } from "./useRealTimeStatusPolling";

// Example component showing how to use the hook
export function AdoptionStatusTracker({ adoptionId }: { adoptionId: string }) {
  const { data, statusChanged, isLoading } = useRealTimeStatusPolling(
    "adoption",
    adoptionId
  );

  if (isLoading) {
    return <div>Loading adoption status...</div>;
  }

  if (!data) {
    return <div>Adoption not found</div>;
  }

  return (
    <div className={`status-badge ${statusChanged ? "pulse" : ""}`}>
      <h3>Adoption Status: {data.status}</h3>
      <p>Adoption ID: {data.id}</p>
      <p>Pet ID: {data.petId}</p>
      <p>Last Updated: {new Date(data.updatedAt).toLocaleString()}</p>

      {statusChanged && (
        <div className="status-change-indicator">
          Status just changed!
        </div>
      )}
    </div>
  );
}

// Example for custody
export function CustodyStatusTracker({ custodyId }: { custodyId: string }) {
  const { data, statusChanged, isLoading } = useRealTimeStatusPolling(
    "custody",
    custodyId,
    { intervalMs: 10000 } // Custom 10-second interval
  );

  if (isLoading) {
    return <div>Loading custody status...</div>;
  }

  if (!data) {
    return <div>Custody not found</div>;
  }

  // Type guard for custody-specific fields
  const isCustody = 'custodianId' in data && 'ownerId' in data;

  return (
    <div className={`status-badge ${statusChanged ? "pulse" : ""}`}>
      <h3>Custody Status: {data.status}</h3>
      <p>Custody ID: {data.id}</p>
      <p>Pet ID: {data.petId}</p>
      {isCustody && (
        <>
          <p>Custodian: {data.custodianId}</p>
          <p>Owner: {data.ownerId}</p>
        </>
      )}

      {statusChanged && (
        <div className="status-change-indicator">
          Status just changed!
        </div>
      )}
    </div>
  );
}
