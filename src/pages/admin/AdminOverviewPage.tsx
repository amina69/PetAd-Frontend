import { useAdminStats } from "../../features/admin/hooks/useAdminStats";
import { StatCard } from "../../features/admin/components/StatCard";
import { FileCheck2, Gavel, PawPrint, Users } from "lucide-react";

const cards = [
  { key: "approvals", title: "Pending approvals", to: "/admin/approvals?status=pending", icon: <PawPrint aria-hidden="true" /> },
  { key: "disputes", title: "Open disputes", to: "/admin/disputes?status=open", icon: <Gavel aria-hidden="true" /> },
  { key: "documents", title: "Documents awaiting verification", to: "/admin/documents?status=pending", icon: <FileCheck2 aria-hidden="true" /> },
  { key: "users", title: "New users this week", to: "/admin/users?createdThisWeek=true", icon: <Users aria-hidden="true" /> },
];

export default function AdminOverviewPage() {
  const stats = useAdminStats();
  return (
    <div className="space-y-6">
      <header><p className="text-sm font-semibold text-emerald-800">Administration</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Overview</h1><p className="mt-2 text-slate-600">A live summary of the queues that need attention.</p></header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => {
          const stat = stats[index];
          const { key: cardKey, ...cardProps } = card;
          return stat ? <StatCard key={cardKey} {...cardProps} value={stat.data?.count} isLoading={stat.isLoading} isError={stat.isError} onRetry={() => { void stat.refetch(); }} /> : null;
        })}
      </div>
    </div>
  );
}
