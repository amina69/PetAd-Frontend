import { useState } from "react";
import ownerImage from "../../assets/mockownder.png";

interface InterestedUser {
  id: number;
  name: string;
  location: string;
  date: string;
  status: "pending" | "approved" | "rejected";
}

export default function InterestedUsersTab() {
  const [users, setUsers] = useState<InterestedUser[]>([
    {
      id: 1,
      name: "Angela Christoper",
      location: "Mainland, Lagos Nigeria",
      date: "10 jan 2026",
      status: "pending",
    },
    {
      id: 2,
      name: "Angela Christoper",
      location: "Mainland, Lagos Nigeria",
      date: "22 jan 2026",
      status: "pending",
    },
    {
      id: 3,
      name: "Angela Christoper",
      location: "Mainland, Lagos Nigeria",
      date: "29 jan 2026",
      status: "pending",
    },
    {
      id: 4,
      name: "Angela Christoper",
      location: "Mainland, Lagos Nigeria",
      date: "01 feb 2026",
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
    <div className="border border-gray-200 rounded-xl overflow-hidden max-w-lg">
      {users.map((user, index) => (
        <div
          key={user.id}
          className={`flex items-center justify-between px-4 py-3 ${
            index !== users.length - 1 ? "border-b border-gray-100" : ""
          }`}
        >
          {/* Avatar + info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
              <img
                src={ownerImage}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0D162B]">{user.name}</p>
              <div className="flex items-center gap-1">
                <svg
                  className="w-3 h-3 text-gray-400 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <p className="text-xs text-gray-400">{user.location}</p>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{user.date}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {user.status === "pending" ? (
              <>
                <button
                  onClick={() => handleReject(user.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(user.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Approve
                </button>
              </>
            ) : (
              <span
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  user.status === "approved"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {user.status === "approved" ? "Approved" : "Rejected"}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
