import { useEffect, useState } from "react";
import { usePendingApprovalsCount } from "../../hooks/usePendingApprovalsCount";
import {
  setBannerDismissed,
  shouldShowBanner,
} from "../../lib/approvalBannerSession";
import { Link } from "react-router-dom";

export default function ApprovalBanner() {
  const { count, isLoading } = usePendingApprovalsCount();
  const [visible, setVisible] = useState(false);

  const role = localStorage.getItem("role");
  const allowed = role === "ADMIN" || role === "SHELTER";

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