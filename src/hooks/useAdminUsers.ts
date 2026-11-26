import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../api/adminService";
import { STALE_TIME } from "../lib/staleTime";
import type { UserRole } from "../types/auth";
import type { AdminUser, AdminUserDetail } from "../types/admin";
import { useDebouncedValue } from "./useDebouncedValue";

export const adminUserKeys = {
  all: ["admin", "users"] as const,
  list: (search: string) => ["admin", "users", "list", search] as const,
  detail: (id: string | null) => ["admin", "users", "detail", id] as const,
};

/** Searchable user list; the search term is debounced before it hits the API. */
export function useAdminUsers(search: string) {
  const debounced = useDebouncedValue(search.trim(), 300);

  const query = useQuery<AdminUser[]>({
    queryKey: adminUserKeys.list(debounced),
    queryFn: () => adminService.listUsers(debounced),
    // Admin tooling must reflect suspensions and role changes made elsewhere, so keep a short cache.
    staleTime: STALE_TIME.APPROVALS,
  });

  return { ...query, users: query.data ?? [], isSearching: search.trim() !== debounced };
}

export function useAdminUserDetail(id: string | null) {
  return useQuery<AdminUserDetail>({
    queryKey: adminUserKeys.detail(id),
    queryFn: () => adminService.getUser(id as string),
    enabled: Boolean(id),
    // Drawer data is reloaded on every open and by mutation invalidation.
    staleTime: STALE_TIME.NOTIFICATIONS,
  });
}

/** Suspend / reinstate / change-role mutations; each refreshes list and detail. */
export function useAdminUserActions() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: adminUserKeys.all });

  const suspend = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminService.suspendUser(id, reason),
    onSuccess: refresh,
  });
  const reinstate = useMutation({
    mutationFn: (id: string) => adminService.reinstateUser(id),
    onSuccess: refresh,
  });
  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      adminService.changeRole(id, role),
    onSuccess: refresh,
  });

  return { suspend, reinstate, changeRole };
}
