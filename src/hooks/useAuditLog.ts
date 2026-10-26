import { useQuery } from "@tanstack/react-query";
import { adminService } from "../api/adminService";
import { STALE_TIME } from "../lib/staleTime";
import type { AuditLogEntry, AuditLogFilters } from "../types/admin";

export function useAuditLog(filters: AuditLogFilters) {
  const query = useQuery<AuditLogEntry[]>({
    queryKey: ["admin", "audit-log", filters],
    queryFn: () => adminService.getAuditLog(filters),
    // Audit entries are append-only history, so a one-minute cache is safe.
    staleTime: STALE_TIME.APPROVALS,
  });

  return { ...query, entries: query.data ?? [] };
}
