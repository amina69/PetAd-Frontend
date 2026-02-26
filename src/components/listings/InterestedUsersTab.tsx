import { useState } from "react";

export default function InterestedUsersTab() {
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "Angela Christoper",
      location: "Mainland, Lagos Nigeria",
      date: "10 Jan 2026",
      status: "pending",
    },
  ]);

  const handleApprove = (id: number) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: "approved" } : u)),
    );
  };

  const handleReject = (id: number) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: "rejected" } : u)),
    );
  };

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between border border-gray-100 rounded-xl p-4"
        >
          <div>
            <p className="font-semibold text-[#0D162B]">{user.name}</p>
            <p className="text-sm text-gray-400">{user.location}</p>
            <p className="text-xs text-gray-400">{user.date}</p>
          </div>

          <div>
            {user.status === "pending" ? (
              <div className="flex gap-3">
                <button
                  onClick={() => handleReject(user.id)}
                  className="px-4 py-2 text-sm bg-red-100 text-red-600 rounded-md"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(user.id)}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-md"
                >
                  Approve
                </button>
              </div>
            ) : (
              <span
                className={`px-3 py-1 rounded-md text-sm font-semibold ${
                  user.status === "approved"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {user.status.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
