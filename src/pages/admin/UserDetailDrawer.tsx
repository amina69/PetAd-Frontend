import { useState } from "react";
import toast from "react-hot-toast";
import { ConfirmationModal } from "../../components/modals/ConfirmationModal";
import { RoleBadge } from "../../components/ui/RoleBadge";
import { useAdminUserActions, useAdminUserDetail } from "../../hooks/useAdminUsers";
import type { UserRole } from "../../types/auth";

const ROLES: UserRole[] = ["USER", "SHELTER", "ADMIN"];

interface UserDetailDrawerProps {
  userId: string | null;
  onClose: () => void;
}

export function UserDetailDrawer({ userId, onClose }: UserDetailDrawerProps) {
  const { data: user, isLoading, isError } = useAdminUserDetail(userId);
  const { suspend, reinstate, changeRole } = useAdminUserActions();
  const currentUserId = localStorage.getItem("petad_user_id");

  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const [suspending, setSuspending] = useState(false);
  const [reason, setReason] = useState("");

  if (!userId) return null;

  const isSelf = user?.id === currentUserId;
  const reasonValid = reason.trim().length > 0;

  const submitSuspension = async () => {
    if (!user || !reasonValid) return;
    try {
      await suspend.mutateAsync({ id: user.id, reason: reason.trim() });
      toast.success(`${user.name} has been suspended`);
      setSuspending(false);
      setReason("");
    } catch {
      toast.error("Failed to suspend user");
    }
  };

  const confirmRoleChange = async () => {
    if (!user || !pendingRole) return;
    try {
      await changeRole.mutateAsync({ id: user.id, role: pendingRole });
      toast.success(`${user.name} is now ${pendingRole}`);
    } catch {
      toast.error("Failed to change role");
    }
    setPendingRole(null);
  };

  const reinstateUser = async () => {
    if (!user) return;
    try {
      await reinstate.mutateAsync(user.id);
      toast.success(`${user.name} has been reinstated`);
    } catch {
      toast.error("Failed to reinstate user");
    }
  };

  return (
    <aside
      role="dialog"
      aria-label="User details"
      className="fixed inset-y-0 right-0 z-40 w-full max-w-md overflow-y-auto border-l border-gray-200 bg-white p-6 shadow-xl"
    >
      <button type="button" onClick={onClose} className="mb-4 text-sm text-gray-500 underline">
        Close
      </button>

      {isLoading && <p role="status">Loading user…</p>}
      {isError && <p role="alert" className="text-sm text-red-700">Could not load this user.</p>}

      {user && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <RoleBadge role={user.role} />
              <span className="text-xs font-semibold text-gray-600">{user.status}</span>
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-3 text-center">
            {(["adoptions", "listings", "disputes"] as const).map((key) => (
              <div key={key} className="rounded-lg bg-gray-50 p-3">
                <dd className="text-lg font-semibold">{user.activity[key]}</dd>
                <dt className="text-xs capitalize text-gray-500">{key}</dt>
              </div>
            ))}
          </dl>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-gray-900">Recent disputes</h3>
            {user.recentDisputes.length === 0 ? (
              <p className="text-sm text-gray-500">No disputes.</p>
            ) : (
              <ul className="space-y-1 text-sm text-gray-700">
                {user.recentDisputes.map((d) => (
                  <li key={d.id}>
                    {d.id} · {d.status}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <label htmlFor="role-select" className="mb-1 block text-sm font-semibold text-gray-900">
              Role
            </label>
            <select
              id="role-select"
              value={user.role}
              disabled={isSelf}
              title={isSelf ? "You cannot change your own role" : undefined}
              aria-describedby={isSelf ? "role-self-hint" : undefined}
              onChange={(e) => setPendingRole(e.target.value as UserRole)}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            {isSelf && (
              <p id="role-self-hint" className="mt-1 text-xs text-gray-500">
                You cannot change your own role.
              </p>
            )}
          </section>

          <section>
            {user.status === "SUSPENDED" ? (
              <button
                type="button"
                onClick={() => void reinstateUser()}
                disabled={reinstate.isPending}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Reinstate user
              </button>
            ) : suspending ? (
              <div className="space-y-2">
                <label htmlFor="suspend-reason" className="block text-sm font-semibold text-gray-900">
                  Reason for suspension
                </label>
                <textarea
                  id="suspend-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!reasonValid || suspend.isPending}
                    onClick={() => void submitSuspension()}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Confirm suspension
                  </button>
                  <button type="button" onClick={() => setSuspending(false)} className="text-sm underline">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSuspending(true)}
                className="rounded-lg border border-red-600 px-4 py-2 text-sm font-semibold text-red-700"
              >
                Suspend user
              </button>
            )}
          </section>
        </div>
      )}

      <ConfirmationModal
        isOpen={pendingRole !== null && Boolean(user)}
        title="Change role?"
        body={`Change ${user?.name ?? "this user"}'s role from ${user?.role} to ${pendingRole}?`}
        confirmLabel={`Change to ${pendingRole}`}
        onConfirm={() => void confirmRoleChange()}
        onCancel={() => setPendingRole(null)}
        isDangerous
      />
    </aside>
  );
}
