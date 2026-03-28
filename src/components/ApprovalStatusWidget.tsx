import { ClockIcon, CheckCircleIcon, XCircleIcon } from "./icons/StatusIcons";

interface ApprovalRole {
  id: string;
  name: string;
  avatar?: string;
}

interface ApprovalStatusWidgetProps {
  required: ApprovalRole[];
  given: ApprovalRole[];
  pending: ApprovalRole[];
}

export function ApprovalStatusWidget({
  required,
  given,
  pending,
}: ApprovalStatusWidgetProps) {
  const getInitial = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  const renderRole = (
    role: ApprovalRole,
    status: "pending" | "approved" | "rejected"
  ) => {
    const statusConfig = {
      pending: { icon: ClockIcon, label: "Pending" },
      approved: { icon: CheckCircleIcon, label: "Approved" },
      rejected: { icon: XCircleIcon, label: "Rejected" },
    };

    const { icon: IconComponent, label } = statusConfig[status];

    return (
      <div
        key={role.id}
        className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
        aria-label={`${role.name} - ${label}`}
      >
        <div className="flex-shrink-0">
          {role.avatar ? (
            <img
              src={role.avatar}
              alt={role.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-semibold text-sm">
              {getInitial(role.name)}
            </div>
          )}
        </div>

        <div className="flex-1">
          <p className="text-sm font-medium text-slate-900">{role.name}</p>
        </div>

        <div className="flex items-center gap-2">
          <IconComponent />
          <span className="text-xs font-medium text-slate-600">{label}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      {required.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600 mb-3">
            Required Approvals
          </h3>
          <div className="space-y-2">
            {required.map((role) => renderRole(role, "approved"))}
          </div>
        </section>
      )}

      {given.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600 mb-3">
            Given Approvals
          </h3>
          <div className="space-y-2">
            {given.map((role) => renderRole(role, "approved"))}
          </div>
        </section>
      )}

      {pending.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600 mb-3">
            Pending Approvals
          </h3>
          <div className="space-y-2">
            {pending.map((role) => renderRole(role, "pending"))}
          </div>
        </section>
      )}

      {required.length === 0 && given.length === 0 && pending.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-600">No approvals to display</p>
        </div>
      )}
    </div>
  );
}
