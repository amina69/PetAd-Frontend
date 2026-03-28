type EmptyStateAction = {
  label: string;
  onClick: () => void;
};

type EmptyStateProps = {
  title: string;
  description: string;
  action?: EmptyStateAction;
};

/**
 * Consistent empty state display used when lists, queues, and pages have no data.
 *
 * @example
 * <EmptyState
 *   title="No settlements yet"
 *   description="Settlement data will appear here once the escrow is triggered."
 *   action={{ label: "Refresh", onClick: refetch }}
 * />
 */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-label={title}
      className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center"
    >
      {/* Icon area */}
      <div
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4m16 0H4"
          />
        </svg>
      </div>

      {/* Text */}
      <div className="space-y-1">
        <p className="text-base font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      {/* Optional action */}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}