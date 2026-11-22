import { useApiQuery } from "../../../hooks/useApiQuery";
import { apiClient } from "../../../lib/api-client";

export interface AdminStat {
  count: number;
}

function countFrom(payload: unknown): AdminStat {
  if (typeof payload === "number") return { count: payload };
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const count = record.count ?? record.total ?? record.totalCount;
    if (typeof count === "number" && Number.isFinite(count)) return { count };
  }
  throw new Error("The admin statistics response did not include a count.");
}

const stats = [
  { key: "approvals", path: "/admin/approvals?status=pending&limit=0" },
  { key: "disputes", path: "/admin/disputes?status=open&limit=0" },
  { key: "documents", path: "/admin/documents?status=pending&limit=0" },
  { key: "users", path: "/admin/users?createdThisWeek=true&limit=0" },
] as const;

export function useAdminStats() {
  const approvals = useStat(stats[0].key, stats[0].path);
  const disputes = useStat(stats[1].key, stats[1].path);
  const documents = useStat(stats[2].key, stats[2].path);
  const users = useStat(stats[3].key, stats[3].path);
  return [
    { key: stats[0].key, ...approvals },
    { key: stats[1].key, ...disputes },
    { key: stats[2].key, ...documents },
    { key: stats[3].key, ...users },
  ];
}

function useStat(key: string, path: string) {
  return useApiQuery<AdminStat>(["admin-stat", key], async () =>
    countFrom(await apiClient.get<unknown>(path)), {
      refetchInterval: 60_000,
      refetchIntervalInBackground: false,
      staleTime: 0,
      retry: false,
    });
}
