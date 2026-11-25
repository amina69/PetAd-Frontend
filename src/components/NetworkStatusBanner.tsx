import { useEffect } from "react";
import { setNetworkOnline } from "../lib/resilience";
import { useResilienceStatus } from "../hooks/useResilienceStatus";

export function NetworkStatusBanner() {
  const { offline, serviceUnavailable } = useResilienceStatus();

  useEffect(() => {
    const handleOnline = () => setNetworkOnline(true);
    const handleOffline = () => setNetworkOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setNetworkOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!offline && !serviceUnavailable) return null;

  return (
    <div
      role={offline ? "status" : "alert"}
      aria-live="polite"
      className="bg-amber-100 px-4 py-3 text-center text-sm font-medium text-amber-950"
      data-testid="network-status-banner"
    >
      {offline
        ? "You are offline. Changes will be saved when your connection returns."
        : "Some services are temporarily unavailable. Please try again shortly."}
    </div>
  );
}
