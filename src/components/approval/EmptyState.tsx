import React from "react";

export interface EmptyStateProps {
  /** The main heading explaining the empty state */
  title: string;
  /** Additional details or instructions */
  description?: React.ReactNode;
  /** An optional icon element (e.g., from lucide-react) */
  icon?: React.ReactNode;
  /** Optional action button or link to help the user recover from the empty state */
  action?: React.ReactNode;
  /** Optional additional CSS classes for the container */
  className?: string;
}

/**
 * A reusable component for displaying an empty state when there is no data
 * available to show to the user (e.g., empty lists, no search results).
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
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      
      {description && (
        <div className="mt-2 max-w-sm text-sm text-slate-500" data-testid="empty-state-message">
          {description}
        </div>
      )}
      
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}