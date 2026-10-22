import { useState } from "react";
import { AdminOnly } from "../../components/auth/AdminOnly";
import { RoleBadge } from "../../components/ui/RoleBadge";
import { useAdminUsers } from "../../hooks/useAdminUsers";
import { UserDetailDrawer } from "./UserDetailDrawer";

function UsersList() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { users, isLoading, isError, refetch } = useAdminUsers(search);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>

        <div>
          <label htmlFor="user-search" className="sr-only">
            Search users
          </label>
          <input
            id="user-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm sm:max-w-sm"
          />
        </div>

        {isLoading && <p role="status">Loading users…</p>}
        {isError && (
          <div role="alert" className="text-sm text-red-700">
            Could not load users.{" "}
            <button type="button" className="underline" onClick={() => void refetch()}>
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && users.length === 0 && (
          <p className="rounded-xl bg-white p-8 text-center text-gray-600">No users found.</p>
        )}

        {users.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedId(user.id)}
                        className="font-medium text-emerald-700 underline"
                      >
                        {user.name}
                      </button>
                    </td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-3">{user.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UserDetailDrawer userId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

export default function UsersPage() {
  return (
    <AdminOnly>
      <UsersList />
    </AdminOnly>
  );
}
