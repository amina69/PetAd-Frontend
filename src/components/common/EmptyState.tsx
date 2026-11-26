import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/**
 * Presentational empty state for lists and queues.
 *
 * @example
 * <EmptyState title="No pets yet" description="Listings will show up here." />
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 ${className}`}
    >
      {icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          {icon}
        </div>
      ) : null}
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {description ? (
        <div className="mt-2 max-w-sm text-sm text-slate-500" data-testid="empty-state-message">
          {description}
        </div>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
