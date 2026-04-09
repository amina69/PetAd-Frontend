import { useNavigate } from "react-router-dom";
import { MainLayout } from "../components/layout/MainLayout";
import { useRoleGuard } from "../hooks/useRoleGuard";
import { usePendingApprovals } from "../hooks/usePendingApprovals";
import { CheckCircle, AlertCircle, Loader } from "lucide-react";

export function ApprovalsPage() {
  const navigate = useNavigate();
  const { role, isLoading: roleLoading } = useRoleGuard();
  const {
    approvalsData,
    isLoading: dataLoading,
    isError,
    isForbidden,
    pendingCount,
  } = usePendingApprovals();

  // Role guard - redirect if not authorized
  if (!roleLoading && (!role || !["admin", "shelter"].includes(role))) {
    navigate("/home");
    return null;
  }

  if (isForbidden) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h1>
            <p className="text-gray-600">
              You do not have permission to view this page.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (isError) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Error Loading Approvals
            </h1>
            <p className="text-gray-600">
              Failed to load approvals. Please try again later.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle size={32} className="text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Approvals</h1>
          </div>
          <p className="text-gray-600">
            Manage and review pending adoption approvals
          </p>
        </div>

        {/* Pending Count Banner */}
        {pendingCount > 0 && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              {dataLoading ? (
                <Loader size={20} className="animate-spin text-blue-600" />
              ) : (
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </div>
              )}
              <p className="text-blue-800 font-medium">
                {pendingCount} pending approval{pendingCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {dataLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader size={32} className="animate-spin text-gray-400" />
          </div>
        )}

        {/* Empty State */}
        {!dataLoading && pendingCount === 0 && (
          <div className="text-center py-12">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              All caught up!
            </h2>
            <p className="text-gray-600">
              There are no pending approvals at this time.
            </p>
          </div>
        )}

        {/* Approvals List */}
        {!dataLoading && approvalsData && approvalsData.data.length > 0 && (
          <div className="space-y-4">
            {approvalsData.data.map((approval) => (
              <div
                key={approval.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Approval ID: {approval.id}
                    </p>
                    <p className="text-sm text-gray-600">
                      Status:{" "}
                      <span className="font-medium">{approval.status}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Created:{" "}
                      {new Date(approval.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Info */}
        {approvalsData && (
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>
              Showing {approvalsData.data.length} of {approvalsData.total}{" "}
              approvals
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
