import { apiClient } from "../lib/api-client";
import type { UserRole } from "../types/auth";
import type {
  AdminUser,
  AdminUserDetail,
  AuditLogEntry,
  AuditLogFilters,
} from "../types/admin";

function qs(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

export const adminService = {
  listUsers: (search?: string) =>
    apiClient.get<AdminUser[]>(`/admin/users${qs({ search })}`),
  getUser: (id: string) => apiClient.get<AdminUserDetail>(`/admin/users/${id}`),
  suspendUser: (id: string, reason: string) =>
    apiClient.post<AdminUser>(`/admin/users/${id}/suspend`, { reason }),
  reinstateUser: (id: string) =>
    apiClient.post<AdminUser>(`/admin/users/${id}/reinstate`, {}),
  changeRole: (id: string, role: UserRole) =>
    apiClient.patch<AdminUser>(`/admin/users/${id}/role`, { role }),
  getAuditLog: (filters: AuditLogFilters) =>
    apiClient.get<AuditLogEntry[]>(`/admin/audit-log${qs({ ...filters })}`),
};
