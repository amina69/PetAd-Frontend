import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useRoleGuard } from "../../hooks/useRoleGuard";
import AdminApprovalQueuePage from "../AdminApprovalQueuePage";

export default function ApplicationQueuePage() {
  const { isAdmin } = useRoleGuard();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!searchParams.has("status")) {
      const initialParams = new URLSearchParams(searchParams);
      initialParams.set("status", "PENDING");
      setSearchParams(initialParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  if (!isAdmin) {
    return (
      <div role="alert" className="mx-auto my-16 max-w-xl rounded-xl bg-red-50 p-6 text-center text-red-800">
        Administrator access is required to review applications.
      </div>
    );
  }

  return <AdminApprovalQueuePage />;
}
