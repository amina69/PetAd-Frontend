import { useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api-client";
import { usePolling } from "./usePolling";
import { useRoleGuard } from "../../hooks/useRoleGuard";
import type { DisputeListResponse } from "../../types/dispute";

const DISPUTE_ROUTES = ["/disputes", "/admin/disputes"];
const POLL_INTERVAL_MS = 300_000; // 5 minutes
const MAX_DISPLAY = 9;

export function useDisputeCount() {
  const { isAdmin } = useRoleGuard();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Primitive string — stable across renders when role doesn't change
  const role = isAdmin ? "admin" : "user";
  const queryKey = ["dispute-count", role];

  const fetchCount = useCallback(async (): Promise<number> => {
    if (isAdmin) {
      const [openRes, underReviewRes] = await Promise.all([
        apiClient.get<DisputeListResponse>("/disputes?status=open"),
        apiClient.get<DisputeListResponse>("/disputes?status=under_review"),
      ]);
      return openRes.data.length + underReviewRes.data.length;
    }
    // USER / SHELTER: server returns only their disputes via auth token
    const res = await apiClient.get<DisputeListResponse>("/disputes?status=open");
    return res.data.length;
  }, [isAdmin]);

  const query = usePolling<number>(queryKey, fetchCount, {
    intervalMs: POLL_INTERVAL_MS,
    pauseOnHidden: true,
  });

  // Reset count to 0 when user visits a dispute route
  useEffect(() => {
    if (!DISPUTE_ROUTES.includes(location.pathname)) return;
    queryClient.setQueryData(["dispute-count", role], 0);
  }, [location.pathname, queryClient, role]);

  const count = query.data ?? 0;

  return {
    count,
    displayCount: count > MAX_DISPLAY ? `${MAX_DISPLAY}+` : String(count),
    isLoading: query.isLoading,
  };
}