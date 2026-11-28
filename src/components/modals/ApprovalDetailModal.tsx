import { X, CheckCircle2, XCircle, Clock, Users } from "lucide-react";
import type { ApprovalRowData } from "../approval/ApprovalStatusWidget";

export interface ApprovalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  received: number;
  required: number;
  approvals: ApprovalRowData[];
}

const STATUS_CONFIG = {
  approved: { icon: CheckCircle2, label: "Approved", className: "text-green-600 bg-green-50 border-green-100" },
  rejected: { icon: XCircle, label: "Rejected", className: "text-red-600 bg-red-50 border-red-100" },
  pending: { icon: Clock, label: "Pending", className: "text-amber-600 bg-amber-50 border-amber-100" },
} as const;

export function ApprovalDetailModal({
  isOpen,
  onClose,
  title,
  received,
  required,
  approvals,
}: ApprovalDetailModalProps) {
  if (!isOpen) return null;

  const pct = Math.min(Math.round((received / required) * 100), 100);
  const quorumMet = received >= required;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-gray-500" aria-hidden="true" />
            <h2
              id="approval-modal-title"
              className="text-base font-semibold text-gray-900 dark:text-gray-100"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close approval detail"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500 dark:text-gray-400">Quorum progress</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {received} of {required}
              </span>
            </div>
            <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                role="progressbar"
                aria-valuenow={received}
                aria-valuemin={0}
                aria-valuemax={required}
                aria-label={`${received} of ${required} approvals received`}
                className={`h-full rounded-full transition-all duration-500 ${
                  quorumMet ? "bg-green-500" : "bg-blue-500"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {quorumMet ? (
              <p className="mt-2 text-xs font-medium text-green-600">
                All approvals received — quorum met
              </p>
            ) : (
              <p className="mt-2 text-xs text-gray-400">
                {required - received} more approval{required - received !== 1 ? "s" : ""} needed
              </p>
            )}
          </div>

          {/* Approver rows */}
          {approvals.length > 0 && (
            <ul
              aria-label="Approver list"
              className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4"
            >
              {approvals.map((a) => {
                const cfg = STATUS_CONFIG[a.status];
                const Icon = cfg.icon;
                return (
                  <li
                    key={a.id}
                    className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-50 dark:bg-gray-800/60"
                  >
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {a.approverName}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.className}`}
                    >
                      <Icon size={12} aria-hidden="true" />
                      {cfg.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
