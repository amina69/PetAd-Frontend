import type { UserRole } from "./auth";

export type AdminUserStatus = "ACTIVE" | "SUSPENDED";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AdminUserStatus;
  createdAt: string;
}

export interface AdminUserDetail extends AdminUser {
  activity: { adoptions: number; listings: number; disputes: number };
  recentDisputes: { id: string; status: string; createdAt: string }[];
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface AuditLogFilters {
  actor?: string;
  action?: string;
  from?: string;
  to?: string;
}
