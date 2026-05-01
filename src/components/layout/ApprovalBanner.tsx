import { useEffect, useState } from "react";
import { usePendingApprovalsCount } from "../../hooks/usePendingApprovalsCount";
import {
  setBannerDismissed,
  shouldShowBanner,
} from "../../lib/approvalBannerSession";
import { Link } from "react-router-dom";

export default function ApprovalBanner() {
  const role = localStorage.getItem("petad_user_role");
  const { count, isLoading } = usePendingApprovalsCount(role);
  const [visible, setVisible] = useState(false);

  const allowed = role === "admin" || role === "shelter";

  useEffect(() => {
    if (!allowed || isLoading) return;

    if (count > 0 && shouldShowBanner(count)) {
      setVisible(true);
    }
  }, [count, isLoading, allowed]);

  if (!visible) return null;

  return (
    <div className="w-full bg-amber-100 border-b border-amber-300 px-4 py-2 flex justify-between items-center">
      <div className="text-amber-900">
        You have {count} adoption(s) awaiting your approval
        <Link to="/shelter/approvals" className="ml-2 underline font-semibold">
          View
        </Link>
      </div>

      <button
        onClick={() => {
          setBannerDismissed(count);
          setVisible(false);
        }}
        className="font-bold"
      >
        ✕
      </button>
    </div>
  );
}