import { Link } from "react-router-dom";
import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  to: string;
  value?: number;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  icon: ReactNode;
}

export function StatCard({ title, to, value, isLoading, isError, onRetry, icon }: StatCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby={`stat-${title}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id={`stat-${title}`} className="text-sm font-medium text-slate-600">{title}</h2>
          {isLoading ? <p role="status" className="mt-3 text-sm text-slate-500">Loading…</p> : isError ? (
            <div role="alert" className="mt-3"><p className="text-sm text-rose-700">Could not load this count.</p><button type="button" onClick={onRetry} className="mt-2 text-sm font-semibold text-emerald-800 underline focus:outline-none focus:ring-2 focus:ring-emerald-600">Retry</button></div>
          ) : <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{value ?? 0}</p>}
        </div>
        <span aria-hidden="true" className="rounded-lg bg-emerald-50 p-2 text-emerald-800">{icon}</span>
      </div>
      {!isError && <Link to={to} className="mt-4 inline-flex text-sm font-semibold text-emerald-800 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-600">View list<span className="sr-only">: {title}</span></Link>}
    </section>
  );
}
