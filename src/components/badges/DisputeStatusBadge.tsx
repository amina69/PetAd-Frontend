import type { DisputeDetail } from '../../pages/disputes/types';

interface Props {
  status: DisputeDetail['status'];
}

export function DisputeStatusBadge({ status }: Props) {
  const styles: Record<DisputeDetail['status'], string> = {
    OPEN: "bg-yellow-100 text-yellow-800",
    UNDER_REVIEW: "bg-blue-100 text-blue-800",
    RESOLVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };

  const labels: Record<DisputeDetail['status'], string> = {
    OPEN: "Open",
    UNDER_REVIEW: "Under Review",
    RESOLVED: "Resolved",
    REJECTED: "Rejected",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
