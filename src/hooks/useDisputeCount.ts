
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { usePolling } from "../lib/hooks/usePolling";
import { apiClient } from "../lib/api-client";
import { useRoleGuard } from "./useRoleGuard";

interface DisputeItem {
  id: string;
  raisedBy: string;
  status: "open" | "under_review" | "resolved" | "closed";
}

const DISPUTE_ROUTES = ["/disputes", "/admin/disputes"];
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_DISPLAY = 9;


export function formatDisputeCount(count: number): string {
  if (count <= 0) return "";
  return count > MAX_DISPLAY ? `${MAX_DISPLAY}+` : String(count);
}

export interface UseDisputeCountResult {
  count: number;
  displayCount: string;
  isLoading: boolean;
}


export function useDisputeCount(currentUserId?: string): UseDisputeCountResult {
  const { isAdmin } = useRoleGuard();
  const location = useLocation();
  const [resetted, setResetted] = useState(false);

  const isOnDisputePage = DISPUTE_ROUTES.some((route) =>
    location.pathname.startsWith(route),
  );

  useEffect(() => {
    if (isOnDisputePage) {
      setResetted(true);
    } else {
      setResetted(false);
    }
  }, [isOnDisputePage]);

  const query = usePolling<DisputeItem[]>(
    ["dispute-count", isAdmin ? "admin" : currentUserId ?? "guest"],
    async () => {
      const disputes = await apiClient.get<DisputeItem[]>(
        "/api/disputes?status=OPEN",
      );
      return disputes;
    },
    {
      intervalMs: POLL_INTERVAL_MS,
      enabled: true,
    },
  );

  const disputes = query.data ?? [];

  const rawCount = isOnDisputePage
    ? 0
    : isAdmin
      ? disputes.filter(
          (d) => d.status === "open" || d.status === "under_review",
        ).length
      : disputes.filter(
          (d) =>
            d.raisedBy === currentUserId &&
            (d.status === "open" || d.status === "under_review"),
        ).length;

  const count = isOnDisputePage ? 0 : rawCount;

  return {
    count,
    displayCount: formatDisputeCount(count),
    isLoading: query.isLoading,
  };
}
